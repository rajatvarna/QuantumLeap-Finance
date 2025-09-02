import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHistoricalCandles } from '../services/finnhubService';
import type { HistoricalPriceData } from '../types';
import SkeletonLoader from './SkeletonLoader';
import { findClosestPrice } from '../utils/findClosestPrice';

interface PricePerformanceProps {
    ticker: string;
}

const PricePerformance: React.FC<PricePerformanceProps> = ({ ticker }) => {

    const { data: historicalData, isLoading, isError } = useQuery<HistoricalPriceData[], Error>({
        queryKey: ['historicalCandles', ticker],
        queryFn: () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1); // Fetch 1 year of data
            
            // Convert to UNIX timestamps for Finnhub
            const to = Math.floor(endDate.getTime() / 1000);
            const from = Math.floor(startDate.getTime() / 1000);

            return fetchHistoricalCandles(ticker, from, to);
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const renderLoadingState = () => (
         <div className="mb-6 flex-shrink-0 border-t border-border pt-4">
            <SkeletonLoader className="h-4 w-1/3 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[...Array(4)].map((_, i) => <SkeletonLoader key={i} className="h-16 w-full" />)}
            </div>
        </div>
    );
    
    if (isLoading) return renderLoadingState();

    if (isError || !historicalData || historicalData.length < 2) {
        // Don't render anything if there's an error or not enough data
        return null;
    }

    const latestPrice = historicalData[historicalData.length - 1].close;
    const today = new Date();
    
    const oneMonthAgo = new Date(); oneMonthAgo.setMonth(today.getMonth() - 1);
    const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(today.getMonth() - 3);
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(today.getMonth() - 6);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const periods = [
        { label: '1M', date: oneMonthAgo },
        { label: '3M', date: threeMonthsAgo },
        { label: '6M', date: sixMonthsAgo },
        { label: 'YTD', date: startOfYear },
    ];
    
    const performanceData = periods.map(period => {
        const pastPriceData = findClosestPrice(period.date, historicalData);
        if (!pastPriceData) return { label: period.label, change: null };
        const change = ((latestPrice - pastPriceData.close) / pastPriceData.close) * 100;
        return { label: period.label, change };
    });

    return (
        <div className="mb-6 flex-shrink-0 border-t border-border pt-4">
            <p className="text-sm text-text-secondary mb-3">Price Performance</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {performanceData.map(item => {
                    if (item.change === null) {
                        return (
                            <div key={item.label} className="bg-background p-2 rounded-lg">
                                <p className="text-xs text-text-tertiary">{item.label}</p>
                                <p className="text-lg font-semibold text-text-tertiary">--</p>
                            </div>
                        );
                    }
                    const isPositive = item.change >= 0;
                    return (
                        <div key={item.label} className="bg-background p-2 rounded-lg">
                            <p className="text-xs text-text-tertiary">{item.label}</p>
                            <p className={`text-lg font-semibold ${isPositive ? 'text-positive' : 'text-negative'}`}>
                                {isPositive ? '+' : ''}{item.change.toFixed(2)}%
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PricePerformance;