import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPerformanceComparison } from '../services/alphavantageService';
import type { PerformanceComparison } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';

interface PerformanceWidgetProps {
    ticker: string;
}

const PerformanceCell: React.FC<{ value: number | null; isTicker?: boolean }> = ({ value, isTicker = false }) => {
    if (value === null || typeof value === 'undefined') {
        return <span className="text-text-tertiary">--</span>;
    }
    const isPositive = value >= 0;
    const colorClass = isPositive ? 'text-positive' : 'text-negative';
    const fontWeightClass = isTicker ? 'font-bold' : 'font-semibold';

    return (
        <span className={`${colorClass} ${fontWeightClass}`}>
            {isPositive ? '+' : ''}{value.toFixed(2)}%
        </span>
    );
};


const PerformanceWidgetContent: React.FC<PerformanceWidgetProps> = ({ ticker }) => {
    const { data, isLoading, isError, error, refetch } = useQuery<PerformanceComparison, Error>({
        queryKey: ['performance', ticker, 'alphavantage'],
        queryFn: () => fetchPerformanceComparison(ticker),
    });

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-3">
                 {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <SkeletonLoader className="h-5 w-10" />
                        <SkeletonLoader className="h-5 w-16" />
                        <SkeletonLoader className="h-5 w-16" />
                        <SkeletonLoader className="h-5 w-16" />
                    </div>
                ))}
            </div>
        );
    }
    
    if (isError) {
        return (
            <div className="text-center p-4">
                <p className="text-negative">Could not load performance data.</p>
                <p className="text-text-secondary text-xs mt-1">{(error as any)?.message}</p>
                <button
                    onClick={() => refetch()}
                    className="mt-2 text-sm bg-accent hover:bg-accent-hover text-white font-bold py-1 px-3 rounded-md transition-colors duration-200"
                    aria-label="Retry fetching performance data"
                >
                    Retry
                </button>
            </div>
        );
    }
    
    if (!data || !data[ticker]) {
        return <div className="text-center text-text-secondary p-4">No performance data found for this stock.</div>;
    }

    const periods = ['1W', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y'];

    return (
        <div className="p-4 sm:p-6">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th scope="col" className="text-left font-medium text-text-tertiary uppercase pb-3 px-2">Period</th>
                        <th scope="col" className="text-right font-medium text-text-primary uppercase pb-3 px-2">{ticker}</th>
                        <th scope="col" className="text-right font-medium text-text-tertiary uppercase pb-3 px-2">SPY</th>
                        <th scope="col" className="text-right font-medium text-text-tertiary uppercase pb-3 px-2">QQQ</th>
                    </tr>
                </thead>
                <tbody>
                    {periods.map(period => (
                        <tr key={period} className="border-b border-border last:border-b-0">
                            <td className="py-3 font-semibold text-text-primary px-2">{period}</td>
                            <td className="text-right font-mono px-2">
                                <PerformanceCell value={data[ticker]?.[period]} isTicker={true} />
                            </td>
                            <td className="text-right font-mono px-2">
                                <PerformanceCell value={data.SPY?.[period]} />
                            </td>
                            <td className="text-right font-mono px-2">
                                <PerformanceCell value={data.QQQ?.[period]} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PerformanceWidget: React.FC<PerformanceWidgetProps> = ({ ticker }) => {
    return (
        <div className="bg-card border border-border rounded-xl h-[500px] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Performance vs. Indices</h3>
            </div>
            <div className="flex-grow overflow-y-auto">
                <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                    <PerformanceWidgetContent ticker={ticker} />
                </FeatureGate>
            </div>
        </div>
    );
};

export default PerformanceWidget;