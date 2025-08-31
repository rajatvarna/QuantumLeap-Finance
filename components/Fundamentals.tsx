import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDetailedFinancialsAndMetrics } from '../services/finnhubService';
import type { FinancialReportRow } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';

interface FundamentalsProps {
    ticker: string;
}

const formatValue = (value: number | string): string => {
    if (typeof value !== 'number') return 'N/A';
    if (Math.abs(value) >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
    }
    if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1e3) {
        return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toFixed(2);
};


const FundamentalsContent: React.FC<FundamentalsProps> = ({ ticker }) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['fundamentals', ticker],
        queryFn: () => fetchDetailedFinancialsAndMetrics(ticker),
    });

    const financials = data ? [
        ...data.incomeStatement,
        ...data.balanceSheet,
        ...data.cashFlowStatement,
        ...data.ratios,
        ...data.multiples,
    ] : undefined;
    const years = data?.years;

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 h-full">
                <SkeletonLoader className="h-full w-full" />
            </div>
        );
    }
    
    if (isError) {
        return <div className="text-center text-negative p-4">Could not load fundamental data.</div>;
    }
    
    if (!financials || financials.length === 0 || !years || years.length === 0) {
        return <div className="text-center text-text-secondary p-4">No fundamental data found.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary">
                <thead className="text-xs text-text-tertiary uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3 font-medium whitespace-nowrap">Metric (Annual)</th>
                        {years.map(year => (
                            <th key={year} scope="col" className="px-6 py-3 font-medium text-right whitespace-nowrap">{year}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {financials.map((row) => (
                        <tr key={row.metric} className="border-b border-border last:border-b-0 hover:bg-background">
                            <td className="px-6 py-4 font-semibold text-text-primary whitespace-nowrap">{row.metric}</td>
                            {years.map(year => (
                                <td key={`${row.metric}-${year}`} className="px-6 py-4 text-right whitespace-nowrap font-mono">
                                    {formatValue(row.values[year])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const Fundamentals: React.FC<FundamentalsProps> = ({ ticker }) => {
    return (
        <div className="bg-card border border-border rounded-xl h-[500px] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Fundamental Data</h3>
            </div>
            <div className="flex-grow overflow-auto">
                <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                    <FundamentalsContent ticker={ticker} />
                </FeatureGate>
            </div>
        </div>
    );
};

export default Fundamentals;
