import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { StockData } from '../types';
import { fetchStockData } from '../services/finnhubService';
import { webSocketManager } from '../services/finnhubService';
import SkeletonLoader from './SkeletonLoader';

interface StockHeaderProps {
    ticker: string;
}

const formatMarketCap = (marketCap: number): string => {
    if (!marketCap) return 'N/A';
    const cap = marketCap * 1000000;
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toFixed(2)}`;
};

const StockHeader: React.FC<StockHeaderProps> = ({ ticker }) => {
    const { data: stockData, isLoading, isError } = useQuery<StockData, Error>({
      queryKey: ['stockData', ticker],
      queryFn: () => fetchStockData(ticker),
      staleTime: Infinity, // Keep initial data fresh, live updates come from WebSocket
      retry: false,
    });

    const [livePrice, setLivePrice] = useState<number | null>(null);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        let timeoutId: number;
        
        setIsLive(false); // Reset live status on ticker change
        
        webSocketManager.subscribe(ticker, (price) => {
            setLivePrice(price);
            
            // Show live indicator for 1 second after a price update
            setIsLive(true);
            clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => setIsLive(false), 1000);
        });

        return () => {
            webSocketManager.unsubscribe(ticker);
            setLivePrice(null);
            clearTimeout(timeoutId);
        };
    }, [ticker]);

    if (isLoading) {
        return <SkeletonLoader className="h-28 w-full rounded-lg" />;
    }

    if (isError || !stockData) {
        return (
            <div className="p-4 bg-brand-secondary rounded-lg border border-red-500/50 text-center text-red-400">
                Failed to fetch data for {ticker}. Please check if the ticker is valid.
            </div>
        );
    }
    
    const displayPrice = livePrice ?? stockData.price;
    const change = displayPrice - stockData.previousClose;
    const changePercent = (change / stockData.previousClose) * 100;
    const isPositive = change >= 0;

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
                    <div className="flex items-center justify-end gap-2">
                         <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} title={isLive ? 'Live data' : 'Delayed data'}></div>
                        <p className="text-4xl font-semibold text-white">${displayPrice.toFixed(2)}</p>
                    </div>
                    <p className={`text-lg font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StockHeader;