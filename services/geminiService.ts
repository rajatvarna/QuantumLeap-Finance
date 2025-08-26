import Sentiment from 'sentiment';
import type { NewsArticle, SentimentAnalysisResult } from '../types';

// This is an English-only sentiment analysis library.
const sentiment = new Sentiment();

/**
 * Analyzes news articles using a client-side library.
 * This is a synchronous operation.
 * @param articles - The news articles to analyze.
 * @returns A sentiment analysis result, or null if no articles are provided.
 */
export const analyzeNewsSentiment = (articles: NewsArticle[]): SentimentAnalysisResult | null => {
    if (!articles || articles.length === 0) {
        return null;
    }
    
    // Concatenate all headlines and summaries for a holistic analysis
    const text = articles
        .slice(0, 25) // Analyze a subset to keep it performant
        .map(a => `${a.headline}. ${a.summary}`)
        .join(' ');
        
    const result = sentiment.analyze(text);
    
    // Normalize the comparative score. The library's output is roughly in the -5 to 5 range.
    // We'll normalize it to a -1 to 1 range for consistency in our UI.
    const sentimentScore = Math.max(-1, Math.min(1, result.comparative / 2.5));

    let overallSentiment: 'Positive' | 'Negative' | 'Neutral';
    if (sentimentScore > 0.1) {
        overallSentiment = 'Positive';
    } else if (sentimentScore < -0.1) {
        overallSentiment = 'Negative';
    } else {
        overallSentiment = 'Neutral';
    }

    const formatWords = (words: string[]): string => {
        if (words.length === 0) return 'none identified';
        // Get unique words, limit to 4 for brevity
        const uniqueWords = [...new Set(words)];
        return uniqueWords.slice(0, 4).map(w => `'${w}'`).join(', ');
    };
    
    const summary = `Analysis based on keywords. Positive drivers: ${formatWords(result.positive)}. Negative drivers: ${formatWords(result.negative)}.`;

    return {
        overallSentiment,
        sentimentScore,
        summary,
    };
};
