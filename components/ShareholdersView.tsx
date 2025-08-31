
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchShareholders, fetchStockData } from '../services/finnhubService';
import type { Shareholder, StockData } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';
import { useSort } from '../hooks/useSort';
import SortIcon from './SortIcon';

interface ShareholdersViewProps {
    ticker: string;
}

// Define a new type for the augmented shareholder data for sorting purposes
interface ShareholderWithOwnership extends Shareholder {
    ownership?: number;
}

const ShareholdersViewContent: React.FC<ShareholdersViewProps> = ({ ticker }) => {
    const { data: shareholders, isLoading, isError, refetch } = useQuery<Shareholder[], Error>({
        queryKey: ['shareholders', ticker],
        queryFn: () => fetchShareholders(ticker),
    });

    // Fetch stockData to get total shares outstanding. This will likely hit the cache.
    const { data: stockData } = useQuery<StockData, Error>({
        queryKey: ['stockData', ticker],
        queryFn: () => fetchStockData(ticker),
        staleTime: Infinity,
    });
    
    // Augment shareholder data with a calculated 'ownership' property for sorting
    const shareholdersWithOwnership = useMemo((): ShareholderWithOwnership[] => {
        if (!shareholders) return [];
        if (!stockData?.shareOutstanding) return shareholders;
        const totalShares = stockData.shareOutstanding * 1_000_000;
        if (totalShares === 0) return shareholders;
        return shareholders.map(holder => ({
            ...holder,
            ownership: (holder.share / totalShares) * 100,
        }));
    }, [shareholders, stockData]);
    
    const { items: sortedShareholders, requestSort, sortConfig } = useSort(shareholdersWithOwnership, { key: 'share', direction: 'desc' });

    if (isLoading) {
        return (
             <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <SkeletonLoader className="h-96 w-full" />
            </div>
        );
    }
    
    if (isError) {
        return (
            <div className="text-center p-8 bg-card border border-border rounded-xl">
                <p className="text-negative font-semibold">Could not load shareholder data.</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    aria-label="Retry fetching shareholder data"
                >
                    Retry
                </button>
            </div>
        );
    }
    
    if (!sortedShareholders || sortedShareholders.length === 0) {
        return <div className="text-center text-text-secondary p-4 bg-card border border-border rounded-xl">No institutional shareholder data found.</div>;
    }

    const SortableHeader: React.FC<{ sortKey: keyof ShareholderWithOwnership; children: React.ReactNode; className?: string }> = ({ sortKey, children, className = '' }) => (
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
        <div className="bg-card border border-border rounded-xl">
            <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Major Institutional Shareholders</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-tertiary uppercase bg-background/50">
                        <tr>
                            <SortableHeader sortKey="name">Holder</SortableHeader>
                            <SortableHeader sortKey="share" className="text-right">Shares</SortableHeader>
                            {stockData?.shareOutstanding && <SortableHeader sortKey="ownership" className="text-right">% Ownership</SortableHeader>}
                            <SortableHeader sortKey="filingDate" className="text-right">Reported</SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedShareholders.slice(0, 50).map((holder, index) => (
                            <tr key={`${holder.name}-${index}`} className="border-b border-border last:border-b-0 hover:bg-background">
                                <td className="px-6 py-4 font-semibold text-text-primary whitespace-nowrap">{holder.name}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap font-mono">{holder.share.toLocaleString()}</td>
                                {stockData?.shareOutstanding && (
                                    <td className="px-6 py-4 text-right whitespace-nowrap font-mono">
                                        {holder.ownership ? `${holder.ownership.toFixed(2)}%` : '--'}
                                    </td>
                                )}
                                <td className="px-6 py-4 text-right whitespace-nowrap">{holder.filingDate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ShareholdersView: React.FC<ShareholdersViewProps> = ({ ticker }) => {
    return (
        <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
            <ShareholdersViewContent ticker={ticker} />
        </FeatureGate>
    );
};

export default ShareholdersView;