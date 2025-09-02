import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchInsiderTransactions } from '../services/finnhubService';
import type { InsiderTransaction } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';
import { useSort } from '../hooks/useSort';
import SortIcon from './SortIcon';

interface InsiderTransactionsViewProps {
    ticker: string;
}

const InsiderTransactionsViewContent: React.FC<InsiderTransactionsViewProps> = ({ ticker }) => {
    const { data: transactions, isLoading, isError, refetch } = useQuery<InsiderTransaction[], Error>({
        queryKey: ['insiderTransactions', ticker],
        queryFn: () => fetchInsiderTransactions(ticker),
    });

    const { items: sortedTransactions, requestSort, sortConfig } = useSort(transactions, { key: 'transactionDate', direction: 'desc' });

    if (isLoading) {
        return (
             <div className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
                <SkeletonLoader className="h-96 w-full" />
            </div>
        );
    }
    
    if (isError) {
        return (
            <div className="text-center p-8 bg-card border border-border rounded-xl shadow-sm">
                <p className="text-negative font-semibold">Could not load insider transaction data.</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    aria-label="Retry fetching insider transactions"
                >
                    Retry
                </button>
            </div>
        );
    }
    
    if (!sortedTransactions || sortedTransactions.length === 0) {
        return <div className="text-center text-text-secondary p-4 bg-card border border-border rounded-xl shadow-sm">No recent insider trading activity found.</div>;
    }

    const SortableHeader: React.FC<{ sortKey: keyof InsiderTransaction; children: React.ReactNode; className?: string }> = ({ sortKey, children, className = '' }) => (
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

    const formatTransactionCode = (code: string) => {
        if (code === 'P' || code === 'P-Purchase') return <span className="text-positive font-semibold">Purchase</span>;
        if (code === 'S' || code === 'S-Sale') return <span className="text-negative font-semibold">Sale</span>;
        return code;
    };

    return (
        <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Insider Trading Activity</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-tertiary uppercase bg-background/50">
                        <tr>
                            <SortableHeader sortKey="name">Insider Name</SortableHeader>
                            <SortableHeader sortKey="transactionDate" className="text-right">Date</SortableHeader>
                            <SortableHeader sortKey="transactionCode" className="text-center">Type</SortableHeader>
                            <SortableHeader sortKey="change" className="text-right">Shares</SortableHeader>
                            <SortableHeader sortKey="transactionPrice" className="text-right">Price</SortableHeader>
                            <SortableHeader sortKey="value" className="text-right">Value</SortableHeader>
                            <SortableHeader sortKey="share" className="text-right">Shares Held</SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTransactions.map((t, index) => (
                            <tr key={`${t.name}-${t.transactionDate}-${index}`} className="border-b border-border last:border-b-0 hover:bg-background">
                                <td className="px-6 py-4 font-semibold text-text-primary whitespace-nowrap">{t.name}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">{t.transactionDate}</td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">{formatTransactionCode(t.transactionCode)}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap font-mono">{t.change.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap font-mono">${t.transactionPrice.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap font-mono">${t.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap font-mono">{t.share.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InsiderTransactionsView: React.FC<InsiderTransactionsViewProps> = ({ ticker }) => {
    return (
        <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
            <InsiderTransactionsViewContent ticker={ticker} />
        </FeatureGate>
    );
};

export default InsiderTransactionsView;