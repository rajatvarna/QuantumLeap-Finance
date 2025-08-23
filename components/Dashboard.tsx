
import React, { useState, useEffect } from 'react';
import StockHeader from './StockHeader';
import StockChart from './StockChart';
import FilingsTable from './FilingsTable';
import NewsFeed from './NewsFeed';
import { fetchStockData } from '../services/geminiService';
import type { StockData } from '../types';
import SkeletonLoader from './SkeletonLoader';

interface DashboardProps {
    ticker: string;
}

const Dashboard: React.FC<DashboardProps> = ({ ticker }) => {
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            setStockData(null);
            const data = await fetchStockData(ticker);
            if (data) {
                setStockData(data);
            } else {
                setError(`Failed to fetch data for ${ticker}. The API might be busy, please try again.`);
            }
            setLoading(false);
        };
        loadData();
    }, [ticker]);

    if (loading) {
        return (
            <div>
                <SkeletonLoader className="h-16 w-3/4 mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <SkeletonLoader className="h-96 w-full" />
                    </div>
                    <div>
                        <SkeletonLoader className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (error || !stockData) {
        return <div className="text-center text-red-400 p-8 bg-brand-secondary rounded-lg">{error || 'No data available.'}</div>;
    }

    return (
        <div className="space-y-8">
            <StockHeader stockData={stockData} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <StockChart ticker={ticker} />
                    <FilingsTable ticker={ticker} />
                </div>
                <div className="lg:col-span-2">
                    <NewsFeed ticker={ticker} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
