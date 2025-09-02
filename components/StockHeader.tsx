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
    // This query now primarily uses cached data from the Dashboard's gatekeeper query.
    const { data: stockData, isLoading, isError, error, refetch } = useQuery<StockData, Error>({
      queryKey: ['stockData', ticker],
      queryFn: () => fetchStockData(ticker),
      staleTime: Infinity, // Keep initial data fresh, live updates come from WebSocket
    });

    const [livePrice, setLivePrice] = useState<number | null>(null);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        let timeoutId: number;
        
        setIsLive(false); // Reset live status on ticker change
        
        webSocketManager.subscribe(ticker, (price) => {
            setLivePrice(price);
            
            // Show live indicator for 2 seconds after a price update
            setIsLive(true);
            clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => setIsLive(false), 2000);
        });

        return () => {
            webSocketManager.unsubscribe(ticker);
            setLivePrice(null);
            clearTimeout(timeoutId);
        };
    }, [ticker]);

    if (isLoading) {
        return <SkeletonLoader className="h-36 w-full rounded-xl" />;
    }

    if (isError || !stockData) {
        // This error state is now less likely to be seen, as the parent Dashboard component handles it.
        // It's kept as a fallback.
        const errorMessage = (error as any)?.status === 401 
            ? "Authentication failed. Please check your API key."
            : `Could not load header data for ${ticker}.`;
        return (
            <div className="p-6 bg-card rounded-xl border border-negative/50 text-center">
                <p className="text-negative">{errorMessage}</p>
                 <button
                    onClick={() => refetch()}
                    className="mt-4 bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                    aria-label="Retry fetching header data"
                >
                    Retry
                </button>
            </div>
        );
    }
    
    const displayPrice = livePrice ?? stockData.price;
    const change = displayPrice - stockData.previousClose;
    const changePercent = (change / stockData.previousClose) * 100;
    const isPositive = change >= 0;

    return (
        <div className="p-4 sm:p-6 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Left Side: Company Info */}
                <div className="flex-grow">
                    <h2 className="text-3xl font-bold text-text-primary">{stockData.companyName}</h2>
                    <p className="text-lg text-text-secondary">{stockData.ticker}</p>
                </div>
                
                {/* Right Side: Price Info */}
                <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                    <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${isLive ? 'bg-positive animate-pulse-live' : 'bg-text-tertiary'}`} title={isLive ? 'Live data' : 'Delayed data'}></div>
                        <p className="text-5xl font-semibold text-text-primary">${displayPrice.toFixed(2)}</p>
                    </div>
                     <div className={`mt-1 flex items-center justify-end gap-2 text-xl font-semibold ${isPositive ? 'text-positive' : 'text-negative'}`}>
                        <span>{isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}</span>
                        <span className={`px-2 py-0.5 text-base rounded-md ${isPositive ? 'bg-positive/10' : 'bg-negative/10'}`}>
                            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom: Key Stats */}
            <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="text-sm">
                    <span className="text-text-secondary mr-2">Market Cap:</span>
                    <span className="font-semibold text-text-primary">{formatMarketCap(stockData.marketCap)}</span>
                </div>
                {stockData.peRatio && (
                    <div className="text-sm">
                        <span className="text-text-secondary mr-2">P/E Ratio:</span>
                        <span className="font-semibold text-text-primary">{stockData.peRatio.toFixed(2)}</span>
                    </div>
                )}
                 <div className="text-sm">
                    <span className="text-text-secondary mr-2">Prev. Close:</span>
                    <span className="font-semibold text-text-primary">${stockData.previousClose.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default StockHeader;