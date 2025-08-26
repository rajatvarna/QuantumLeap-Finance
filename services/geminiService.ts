import Sentiment from 'sentiment';
import type { NewsArticle, SentimentAnalysisResult } from '../types';

/**
 * Analyzes news articles using a client-side library.
 * @param articles - The news articles to analyze.
 * @returns A sentiment analysis result, or null if no articles are provided.
 */
export const analyzeNewsSentiment = (articles: NewsArticle[]): SentimentAnalysisResult | null => {
    if (!articles || articles.length === 0) {
        return null;
    }

    const sentiment = new Sentiment();
    let totalScore = 0;
    const allWords: { word: string; score: number }[] = [];

    articles.forEach(article => {
        const text = `${article.headline}. ${article.summary}`;
        const result = sentiment.analyze(text);
        totalScore += result.comparative;
        result.positive.forEach(word => allWords.push({ word, score: 1 }));
        result.negative.forEach(word => allWords.push({ word, score: -1 }));
    });

    const sentimentScore = totalScore / articles.length;

    let overallSentiment: 'Positive' | 'Negative' | 'Neutral';
    if (sentimentScore > 0.15) {
        overallSentiment = 'Positive';
    } else if (sentimentScore < -0.15) {
        overallSentiment = 'Negative';
    } else {
        overallSentiment = 'Neutral';
    }
    
    // Generate a simple summary from keywords
    const wordFrequencies = allWords.reduce((acc, { word, score }) => {
        const lowerWord = word.toLowerCase();
        if (!acc[lowerWord]) {
            acc[lowerWord] = { count: 0, score: 0 };
        }
        acc[lowerWord].count++;
        acc[lowerWord].score += score;
        return acc;
    }, {} as Record<string, { count: number, score: number }>);
    
    const sortedWords = Object.entries(wordFrequencies)
        .sort(([, a], [, b]) => b.count - a.count);

    const positiveKeywords = sortedWords.filter(([, data]) => data.score > 0).slice(0, 3).map(([word]) => word);
    const negativeKeywords = sortedWords.filter(([, data]) => data.score < 0).slice(0, 3).map(([word]) => word);

    let summary = `Overall sentiment appears ${overallSentiment.toLowerCase()}.`;
    if (positiveKeywords.length > 0) {
        summary += ` Key positive terms include: ${positiveKeywords.join(', ')}.`;
    }
    if (negativeKeywords.length > 0) {
        summary += ` Key negative terms include: ${negativeKeywords.join(', ')}.`;
    }

    return {
        overallSentiment,
        sentimentScore: parseFloat(sentimentScore.toFixed(2)),
        summary,
    };
};
