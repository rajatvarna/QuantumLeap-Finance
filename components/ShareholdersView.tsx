import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchShareholders, fetchStockData } from '../services/finnhubService';
import type { Shareholder, StockData } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';

interface ShareholdersViewProps {
    ticker: string;
}

const ShareholdersViewContent: React.FC<ShareholdersViewProps> = ({ ticker }) => {
    const { data: shareholders, isLoading, isError } = useQuery<Shareholder[], Error>({
        queryKey: ['shareholders', ticker],
        queryFn: () => fetchShareholders(ticker),
    });

    // Fetch stockData to get total shares outstanding. This will likely hit the cache.
    const { data: stockData } = useQuery<StockData, Error>({
        queryKey: ['stockData', ticker],
        queryFn: () => fetchStockData(ticker),
        staleTime: Infinity,
    });
    
    const totalShares = stockData?.shareOutstanding;

    if (isLoading) {
        return (
             <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <SkeletonLoader className="h-96 w-full" />
            </div>
        );
    }
    
    if (isError) {
        return <div className="text-center text-negative p-4 bg-card border border-border rounded-xl">Could not load shareholder data.</div>;
    }
    
    if (!shareholders || shareholders.length === 0) {
        return <div className="text-center text-text-secondary p-4 bg-card border border-border rounded-xl">No institutional shareholder data found.</div>;
    }

    return (
        <div className="bg-card border border-border rounded-xl">
            <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Major Institutional Shareholders</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-tertiary uppercase bg-background/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 font-medium">Holder</th>
                            <th scope="col" className="px-6 py-3 font-medium text-right">Shares</th>
                            {totalShares && <th scope="col" className="px-6 py-3 font-medium text-right">% Ownership</th>}
                            <th scope="col" className="px-6 py-3 font-medium text-right">Reported</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shareholders.slice(0, 50).map((holder, index) => (
                            <tr key={`${holder.name}-${index}`} className="border-b border-border last:border-b-0 hover:bg-background">
                                <td className="px-6 py-4 font-semibold text-text-primary whitespace-nowrap">{holder.name}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap font-mono">{holder.share.toLocaleString()}</td>
                                {totalShares && (
                                    <td className="px-6 py-4 text-right whitespace-nowrap font-mono">
                                        {((holder.share / (totalShares * 1_000_000)) * 100).toFixed(2)}%
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
