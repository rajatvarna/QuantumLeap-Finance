import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFinancials } from '../services/finnhubService';
import type { AnnualReport } from '../types';
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
        queryKey: ['financials', ticker],
        queryFn: () => fetchFinancials(ticker),
    });

    const financials = data?.reports;
    const years = data?.years;

    if (isLoading) {
        return <SkeletonLoader className="h-64 w-full" />;
    }
    
    if (isError) {
        return <div className="text-center text-red-400 p-4">Could not load fundamental data.</div>;
    }
    
    if (!financials || financials.length === 0 || !years || years.length === 0) {
        return <div className="text-center text-brand-text-secondary p-4">No fundamental data found.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-brand-text-secondary">
                <thead className="text-xs text-brand-text-primary uppercase bg-brand-primary">
                    <tr>
                        <th scope="col" className="px-4 py-3 whitespace-nowrap">Metric (Annual)</th>
                        {years.map(year => (
                            <th key={year} scope="col" className="px-4 py-3 text-right whitespace-nowrap">{year}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {financials.map((row) => (
                        <tr key={row.metric} className="border-b border-brand-border hover:bg-brand-primary">
                            <td className="px-4 py-3 font-semibold text-brand-text-primary whitespace-nowrap">{row.metric}</td>
                            {years.map(year => (
                                <td key={`${row.metric}-${year}`} className="px-4 py-3 text-right whitespace-nowrap">
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
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border">
            <h3 className="text-lg font-semibold mb-4 text-white">Fundamental Data</h3>
            <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                <FundamentalsContent ticker={ticker} />
            </FeatureGate>
        </div>
    );
};

export default Fundamentals;