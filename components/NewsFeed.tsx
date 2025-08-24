import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { fetchNews } from '../services/finnhubService';
import type { NewsArticle } from '../types';
import SkeletonLoader from './SkeletonLoader';

interface NewsFeedProps {
    ticker: string;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ ticker }) => {
    const { data: news, isLoading, isError } = useQuery<NewsArticle[], Error>({
        queryKey: ['news', ticker],
        queryFn: () => fetchNews(ticker),
    });

    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: news?.length ?? 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 110, // Estimate the height of a news item
        overscan: 5,
    });

    const renderContent = () => {
        if (isLoading) {
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

        if (isError) {
            return <div className="text-center text-red-400 p-4">Could not load news articles.</div>;
        }

        if (!news || news.length === 0) {
            return <div className="text-center text-brand-text-secondary p-4">No recent news found for this ticker.</div>;
        }

        return (
             <div ref={parentRef} className="h-[400px] overflow-auto">
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const article = news[virtualItem.index];
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
                                <div className="border-b border-brand-border pb-4 last:border-b-0 h-full">
                                    <div className="text-xs text-brand-text-secondary mb-1">
                                        <span>{article.publishedDate}</span> - <span>{article.source}</span>
                                    </div>
                                    <h4 className="font-semibold text-brand-text-primary hover:text-brand-accent cursor-pointer truncate">
                                        {article.headline}
                                    </h4>
                                    <p className="text-sm text-brand-text-secondary mt-1 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-white">Latest News</h3>
            <div className="flex-grow">
              {renderContent()}
            </div>
        </div>
    );
};

export default NewsFeed;