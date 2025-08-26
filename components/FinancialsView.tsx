import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDetailedFinancialsAndMetrics } from '../services/finnhubService';
import type { FinancialReportRow } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';

interface FinancialsViewProps {
    ticker: string;
}

const formatValue = (value: number | string): string => {
    if (typeof value !== 'number') return '--';
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

const FinancialsTable: React.FC<{ title: string; data: FinancialReportRow[]; years: string[] }> = ({ title, data, years }) => {
    if (data.length === 0) return null;
    return (
        <div className="mb-12">
            <h3 className="text-xl font-semibold text-text-primary mb-4">{title}</h3>
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
                        {data.map((row) => (
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
        </div>
    );
};

const FinancialsViewContent: React.FC<FinancialsViewProps> = ({ ticker }) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['detailedFinancials', ticker],
        queryFn: () => fetchDetailedFinancialsAndMetrics(ticker),
    });

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-8">
                <SkeletonLoader className="h-8 w-1/4" />
                <SkeletonLoader className="h-64 w-full" />
                <SkeletonLoader className="h-8 w-1/4" />
                <SkeletonLoader className="h-48 w-full" />
            </div>
        );
    }
    
    if (isError) {
        return <div className="text-center text-negative p-4">Could not load detailed financial data.</div>;
    }
    
    if (!data || data.years.length === 0) {
        return <div className="text-center text-text-secondary p-4">No detailed financial data found for this stock.</div>;
    }

    return (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
            <FinancialsTable title="Income Statement" data={data.incomeStatement} years={data.years} />
            <FinancialsTable title="Balance Sheet" data={data.balanceSheet} years={data.years} />
            <FinancialsTable title="Cash Flow Statement" data={data.cashFlowStatement} years={data.years} />
            <FinancialsTable title="Key Ratios" data={data.ratios} years={data.years} />
            <FinancialsTable title="Valuation Multiples" data={data.multiples} years={data.years} />
        </div>
    );
};

const FinancialsView: React.FC<FinancialsViewProps> = ({ ticker }) => {
    return (
        <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
            <FinancialsViewContent ticker={ticker} />
        </FeatureGate>
    );
};

export default FinancialsView;