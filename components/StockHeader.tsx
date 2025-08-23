import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { StockData } from '../types';
import { fetchStockData } from '../services/finnhubService';
import SkeletonLoader from './SkeletonLoader';

interface StockHeaderProps {
    ticker: string;
}

const formatMarketCap = (marketCap: number): string => {
    if (!marketCap) return 'N/A';
    // Finnhub provides market cap in millions
    const cap = marketCap * 1000000;

    if (cap >= 1e12) {
        return `$${(cap / 1e12).toFixed(2)}T`;
    }
    if (cap >= 1e9) {
        return `$${(cap / 1e9).toFixed(2)}B`;
    }
    if (cap >= 1e6) {
        return `$${(cap / 1e6).toFixed(2)}M`;
    }
    return `$${cap.toFixed(2)}`;
};


const StockHeader: React.FC<StockHeaderProps> = ({ ticker }) => {
    const { data: stockData, isLoading, isError, error } = useQuery<StockData, Error>({
      queryKey: ['stockData', ticker],
      queryFn: () => fetchStockData(ticker),
      staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
      retry: false, // Don't retry on failure for invalid tickers
    });

    if (isLoading) {
        return <SkeletonLoader className="h-28 w-full rounded-lg" />;
    }

    if (isError) {
        return (
            <div className="p-4 bg-brand-secondary rounded-lg border border-red-500/50 text-center text-red-400">
                Failed to fetch data for {ticker}. Please check if the ticker is valid.
            </div>
        );
    }

    const isPositive = stockData.change >= 0;

    return (
        <div className="p-4 bg-brand-secondary rounded-lg border border-brand-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">{stockData.companyName} ({stockData.ticker})</h2>
                    <div className="flex items-center space-x-4 text-brand-text-secondary text-sm mt-2">
                        <span>Market Cap: <span className="font-semibold text-brand-text-primary">{formatMarketCap(stockData.marketCap)}</span></span>
                        {stockData.peRatio && (
                            <span>P/E Ratio: <span className="font-semibold text-brand-text-primary">{stockData.peRatio.toFixed(2)}</span></span>
                        )}
                    </div>
                </div>
                <div className="mt-4 sm:mt-0 text-right">
                    <p className="text-4xl font-semibold text-white">${stockData.price.toFixed(2)}</p>
                    <p className={`text-lg font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{stockData.change.toFixed(2)} ({isPositive ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StockHeader;