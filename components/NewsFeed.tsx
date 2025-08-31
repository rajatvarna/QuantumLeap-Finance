
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { fetchNews } from '../services/finnhubService';
import { analyzeNewsSentiment } from '../services/geminiService';
import type { NewsArticle, SentimentAnalysisResult } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';
import { useSort } from '../hooks/useSort';

interface NewsFeedProps {
    ticker: string;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const escapeCsvValue = (value: any): string => {
    const stringValue = String(value ?? '').trim();
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

const SentimentAnalysis: React.FC<{
    data: SentimentAnalysisResult | null | undefined,
    isLoading: boolean,
}> = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="px-4 sm:px-6 py-4 border-t border-border">
                <SkeletonLoader className="h-4 w-1/3 mb-2" />
                <SkeletonLoader className="h-4 w-full" />
                <SkeletonLoader className="h-4 w-3/4 mt-1" />
            </div>
        );
    }

    // Fail gracefully by showing nothing if there's an error or no data.
    if (!data) {
        return null; 
    }

    const sentimentColor = {
        Positive: 'text-positive',
        Negative: 'text-negative',
        Neutral: 'text-text-secondary',
    }[data.overallSentiment];
    
    const sentimentBorderColor = {
        Positive: 'border-positive/30',
        Negative: 'border-negative/30',
        Neutral: 'border-border',
    }[data.overallSentiment];

    const sentimentBgColor = {
        Positive: 'bg-positive/10',
        Negative: 'bg-negative/10',
        Neutral: 'bg-background',
    }[data.overallSentiment];


    return (
        <div className={`mx-4 sm:mx-6 my-4 p-4 rounded-lg border ${sentimentBorderColor} ${sentimentBgColor}`}>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Sentiment Analysis</h4>
            <div className="flex items-center gap-3 mb-2">
                <span className={`text-base font-bold w-20 ${sentimentColor}`}>{data.overallSentiment}</span>
                <div className="w-full bg-border rounded-full h-2">
                    {/* The bar represents the score from -1 to 1, mapped to 0% to 100% width */}
                    <div className={`${sentimentColor.replace('text-', 'bg-')} h-2 rounded-full`} style={{ width: `${(data.sentimentScore + 1) / 2 * 100}%` }}></div>
                </div>
                <span className={`font-mono text-sm font-semibold w-12 text-right ${sentimentColor}`}>
                    {data.sentimentScore > 0 ? '+' : ''}{data.sentimentScore.toFixed(2)}
                </span>
            </div>
            <p className="text-sm text-text-secondary">{data.summary}</p>
        </div>
    );
};


const NewsFeed: React.FC<NewsFeedProps> = ({ ticker }) => {
    const { data: news, isLoading: isLoadingNews, isError: isErrorNews } = useQuery<NewsArticle[], Error>({
        queryKey: ['news', ticker],
        queryFn: () => fetchNews(ticker),
    });

    const { items: sortedNews, requestSort, sortConfig } = useSort(news, { key: 'publishedDate', direction: 'desc' });

    // Derive sentiment data directly from news articles using synchronous, client-side analysis.
    const sentimentData = React.useMemo(() => {
        if (!news || news.length === 0) {
            return null;
        }
        return analyzeNewsSentiment(news);
    }, [news]);


    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: sortedNews?.length ?? 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 110, // Estimate the height of a news item
        overscan: 5,
    });
    
    const handleExport = () => {
        if (!sortedNews || sortedNews.length === 0) return;

        const headers = ['publishedDate', 'source', 'headline', 'summary', 'url'];
        const csvContent = [
            headers.join(','),
            ...sortedNews.map(n =>
                headers.map(header => escapeCsvValue(n[header as keyof NewsArticle])).join(',')
            )
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${ticker}-news.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const renderContent = () => {
        if (isLoadingNews) {
            return (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i}>
                            <SkeletonLoader className="h-4 w-1/4 mb-2" />
                            <SkeletonLoader className="h-5 w-full mb-1" />
                            <SkeletonLoader className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            );
        }

        if (isErrorNews) {
            return <div className="text-center text-negative p-4">Could not load news articles.</div>;
        }

        if (!sortedNews || sortedNews.length === 0) {
            return <div className="text-center text-text-secondary p-4">No recent news found for this ticker.</div>;
        }

        return (
             <div ref={parentRef} className="h-full overflow-auto">
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const article = sortedNews[virtualItem.index];
                        return (
                            <div
                                key={virtualItem.key}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                    padding: '8px 2px',
                                }}
                            >
                                <div className="border-b border-border pb-4 last:border-b-0 h-full hover:bg-background/50 rounded-lg p-2 transition-colors">
                                    <div className="text-xs text-text-tertiary mb-1">
                                        <span>{article.publishedDate}</span> - <span>{article.source}</span>
                                    </div>
                                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-text-primary hover:text-accent cursor-pointer block truncate">
                                        {article.headline}
                                    </a>
                                    <p className="text-sm text-text-secondary mt-1 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {article.summary}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };
    
    const SortButton: React.FC<{ sortKey: keyof NewsArticle; children: React.ReactNode }> = ({ sortKey, children }) => {
        const isActive = sortConfig?.key === sortKey;
        const directionIcon = isActive ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '';
        return (
            <button
                onClick={() => requestSort(sortKey)}
                className={`text-xs px-2 py-1 rounded-md transition-colors font-semibold ${isActive ? 'bg-accent/20 text-accent' : 'bg-transparent text-text-secondary hover:bg-background'}`}
            >
                {children} {directionIcon}
            </button>
        );
    };

    return (
        <div className="bg-card border border-border rounded-xl h-[500px] flex flex-col">
             <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-text-primary">Latest News</h3>
                    {news && news.length > 0 && (
                        <div className="flex items-center gap-2 border-l border-border pl-4">
                            <span className="text-xs text-text-tertiary">Sort by:</span>
                            <SortButton sortKey="publishedDate">Date</SortButton>
                            <SortButton sortKey="source">Source</SortButton>
                        </div>
                    )}
                </div>
                {news && news.length > 0 && (
                     <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                        <button
                            onClick={handleExport}
                            className="flex items-center text-sm bg-transparent border border-accent text-accent hover:bg-accent/10 font-bold py-1.5 px-3 rounded-md transition-colors duration-200"
                            aria-label="Export news to CSV"
                        >
                            <DownloadIcon />
                            <span className="hidden sm:inline ml-2">Export</span>
                        </button>
                    </FeatureGate>
                )}
            </div>
             <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                <SentimentAnalysis
                    data={sentimentData}
                    isLoading={isLoadingNews}
                />
            </FeatureGate>
            <div className="flex-grow p-4 sm:p-6 pt-0 overflow-hidden">
              {renderContent()}
            </div>
        </div>
    );
};

export default NewsFeed;
