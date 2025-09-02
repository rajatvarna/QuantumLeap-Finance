
import React, { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchPeers, fetchStockData, fetchHistoricalCandles } from '../services/finnhubService';
import type { PeerComparisonData } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';
import { useSort } from '../hooks/useSort';
import SortIcon from './SortIcon';
import { findClosestPrice } from '../utils/findClosestPrice';

interface PeerComparisonWidgetProps {
    ticker: string;
}

const PeerComparisonContent: React.FC<PeerComparisonWidgetProps> = ({ ticker }) => {
    const { data: peers, isInitialLoading: isLoadingPeers } = useQuery<string[], Error>({
        queryKey: ['peers', ticker],
        queryFn: () => fetchPeers(ticker),
        staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    });

    const tickersToFetch = useMemo(() => [ticker, ...(peers || []).slice(0, 9)], [ticker, peers]);
    
    const peerQueries = useQueries({
        queries: tickersToFetch.map(peerTicker => ({
            queryKey: ['peerData', peerTicker],
            queryFn: async () => {
                const stockData = await fetchStockData(peerTicker);
                
                const endDate = new Date();
                const startDate = new Date(endDate.getFullYear(), 0, 1);
                const to = Math.floor(endDate.getTime() / 1000);
                const from = Math.floor(startDate.getTime() / 1000);
                const candles = await fetchHistoricalCandles(peerTicker, from, to);

                let ytdPerformance: number | null = null;
                if (candles && candles.length > 1) {
                    const latestPrice = candles[candles.length - 1].close;
                    const startOfYearPriceData = findClosestPrice(startDate, candles);
                    if (startOfYearPriceData && startOfYearPriceData.close > 0) {
                        ytdPerformance = ((latestPrice - startOfYearPriceData.close) / startOfYearPriceData.close) * 100;
                    }
                }
                
                return {
                    ticker: peerTicker,
                    companyName: stockData.companyName,
                    marketCap: stockData.marketCap,
                    peRatio: stockData.peRatio,
                    ytdPerformance
                };
            },
            enabled: !!peers,
            staleTime: 1000 * 60 * 15, // Stale time of 15 minutes for peer data
        })),
    });

    const isLoading = isLoadingPeers || peerQueries.some(q => q.isInitialLoading);
    const isError = peerQueries.some(q => q.isError);

    const successfullyFetchedPeers = useMemo(() => 
        peerQueries
            .filter(q => q.isSuccess && q.data)
            .map(q => q.data) as PeerComparisonData[],
        [peerQueries]
    );
    
    const { items: sortedPeers, requestSort, sortConfig } = useSort(successfullyFetchedPeers, { key: 'marketCap', direction: 'desc' });

    if (isLoading) {
        return <SkeletonLoader className="h-96 w-full" />;
    }

    if (isError) {
        return <div className="text-center p-4 text-negative">Error loading peer comparison data.</div>;
    }

    if (sortedPeers.length === 0) {
        return <div className="text-center p-4 text-text-secondary">No peer data available.</div>;
    }
    
    const formatMarketCap = (marketCap: number): string => {
        if (!marketCap) return 'N/A';
        const cap = marketCap * 1000000;
        if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
        if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
        return `$${(cap / 1e6).toFixed(2)}M`;
    };

    const SortableHeader: React.FC<{ sortKey: keyof PeerComparisonData; children: React.ReactNode; className?: string }> = ({ sortKey, children, className = '' }) => (
        <th scope="col" className={`px-6 py-3 font-medium ${className}`}>
             <button className="flex items-center uppercase w-full" onClick={() => requestSort(sortKey)} style={{ justifyContent: className.includes('text-right') ? 'flex-end' : 'flex-start' }}>
                {children}
                <SortIcon
                    isActive={sortConfig?.key === sortKey}
                    direction={sortConfig?.key === sortKey ? sortConfig.direction : null}
                />
            </button>
        </th>
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary">
                <thead className="text-xs text-text-tertiary uppercase bg-background/50">
                    <tr>
                        <SortableHeader sortKey="ticker">Ticker</SortableHeader>
                        <SortableHeader sortKey="marketCap" className="text-right">Market Cap</SortableHeader>
                        <SortableHeader sortKey="peRatio" className="text-right">P/E Ratio</SortableHeader>
                        <SortableHeader sortKey="ytdPerformance" className="text-right">YTD Perf.</SortableHeader>
                    </tr>
                </thead>
                <tbody>
                    {sortedPeers.map((peer) => {
                        const isMainTicker = peer.ticker === ticker;
                        return (
                            <tr key={peer.ticker} className={`border-b border-border last:border-b-0 hover:bg-background ${isMainTicker ? 'bg-accent/10' : ''}`}>
                                <td className="px-6 py-4 font-semibold text-text-primary whitespace-nowrap">
                                    <div>{peer.ticker}</div>
                                    <div className="text-xs text-text-tertiary font-normal truncate max-w-[200px]">{peer.companyName}</div>
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap font-mono">{formatMarketCap(peer.marketCap)}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap font-mono">{peer.peRatio ? peer.peRatio.toFixed(2) : 'N/A'}</td>
                                <td className={`px-6 py-4 text-right whitespace-nowrap font-mono font-semibold ${peer.ytdPerformance === null ? 'text-text-tertiary' : peer.ytdPerformance > 0 ? 'text-positive' : 'text-negative'}`}>
                                    {peer.ytdPerformance !== null ? `${peer.ytdPerformance.toFixed(2)}%` : 'N/A'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


const PeerComparisonWidget: React.FC<PeerComparisonWidgetProps> = ({ ticker }) => {
    return (
        <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Peer Comparison</h3>
            </div>
            <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                <PeerComparisonContent ticker={ticker} />
            </FeatureGate>
        </div>
    );
};

export default PeerComparisonWidget;
