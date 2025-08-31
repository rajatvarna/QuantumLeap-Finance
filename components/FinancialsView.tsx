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

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const escapeCsvValue = (value: any): string => {
    const stringValue = String(value ?? '').trim();
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

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
        <div className="mb-12 last:mb-0">
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

    const handleExport = () => {
        if (!data || data.years.length === 0) return;

        const { years, incomeStatement, balanceSheet, cashFlowStatement, ratios, multiples } = data;

        const headers = ['Metric (Annual)', ...years];

        const sections = [
            { title: 'Income Statement', data: incomeStatement },
            { title: 'Balance Sheet', data: balanceSheet },
            { title: 'Cash Flow Statement', data: cashFlowStatement },
            { title: 'Key Ratios', data: ratios },
            { title: 'Valuation Multiples', data: multiples },
        ];
        
        const csvRows: string[] = [];

        sections.forEach(section => {
            if (section.data.length > 0) {
                csvRows.push(escapeCsvValue(section.title));
                csvRows.push(headers.map(escapeCsvValue).join(','));

                section.data.forEach(row => {
                    const values = [row.metric, ...years.map(year => row.values[year])];
                    csvRows.push(values.map(escapeCsvValue).join(','));
                });

                csvRows.push(''); // Add a blank line between sections
            }
        });
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${ticker}-financials.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

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
        <div className="bg-card border border-border rounded-xl">
             <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-semibold text-text-primary">Detailed Financials</h2>
                <button
                    onClick={handleExport}
                    className="flex items-center text-sm bg-transparent border border-accent text-accent hover:bg-accent/10 font-bold py-1.5 px-3 rounded-md transition-colors duration-200"
                    aria-label="Export financial data to CSV"
                >
                    <DownloadIcon />
                    <span className="hidden sm:inline ml-2">Export to CSV</span>
                </button>
            </div>
            <div className="p-4 sm:p-6">
                <FinancialsTable title="Income Statement" data={data.incomeStatement} years={data.years} />
                <FinancialsTable title="Balance Sheet" data={data.balanceSheet} years={data.years} />
                <FinancialsTable title="Cash Flow Statement" data={data.cashFlowStatement} years={data.years} />
                <FinancialsTable title="Key Ratios" data={data.ratios} years={data.years} />
                <FinancialsTable title="Valuation Multiples" data={data.multiples} years={data.years} />
            </div>
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