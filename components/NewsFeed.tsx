import React, { useState, useEffect } from 'react';
import { fetchNews } from '../services/finnhubService';
import type { NewsArticle } from '../types';
import SkeletonLoader from './SkeletonLoader';

interface NewsFeedProps {
    ticker: string;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ ticker }) => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            const data = await fetchNews(ticker);
            if (data) {
                setNews(data);
            } else {
                setError('Could not load news articles.');
            }
            setLoading(false);
        };
        loadData();
    }, [ticker]);

    const renderContent = () => {
        if (loading) {
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

        if (error) {
            return <div className="text-center text-red-400 p-4">{error}</div>;
        }

        if (news.length === 0) {
            return <div className="text-center text-brand-text-secondary p-4">No recent news found for this ticker.</div>;
        }

        return (
            <div className="space-y-6">
                {news.map((article, index) => (
                    <div key={index} className="border-b border-brand-border pb-4 last:border-b-0">
                        <div className="text-xs text-brand-text-secondary mb-1">
                            <span>{article.publishedDate}</span> - <span>{article.source}</span>
                        </div>
                        <h4 className="font-semibold text-brand-text-primary hover:text-brand-accent cursor-pointer">
                            {article.headline}
                        </h4>
                        <p className="text-sm text-brand-text-secondary mt-1">{article.summary}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border h-full">
            <h3 className="text-lg font-semibold mb-4 text-white">Latest News</h3>
            {renderContent()}
        </div>
    );
};

export default NewsFeed;
