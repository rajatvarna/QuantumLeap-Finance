import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { StockData } from '../types';
import { fetchStockData } from '../services/finnhubService';
import SkeletonLoader from './SkeletonLoader';

interface CompanyOverviewProps {
    ticker: string;
}

const CompanyOverview: React.FC<CompanyOverviewProps> = ({ ticker }) => {
    const { data: stockData, isLoading, isError } = useQuery<StockData, Error>({
        queryKey: ['stockData', ticker],
        queryFn: () => fetchStockData(ticker),
        staleTime: Infinity,
        retry: false,
    });

    if (isLoading) {
        return <SkeletonLoader className="h-40 w-full rounded-xl" />;
    }

    if (isError || !stockData || (!stockData.industry && !stockData.website && !stockData.exchange)) {
        // Don't show the component if there's an error or not enough data to be useful.
        return null;
    }
    
    const infoItems = [
        { label: 'Industry', value: stockData.industry },
        { label: 'Exchange', value: stockData.exchange },
        { label: 'Website', value: stockData.website, isLink: true },
    ].filter(item => item.value);


    return (
        <div className="bg-card border border-border rounded-xl shadow-lg transition-colors duration-300">
            <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Company Overview</h3>
            </div>
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start gap-6">
                {stockData.logo && (
                    <div className="flex-shrink-0 w-24 h-24 bg-background rounded-lg flex items-center justify-center p-2">
                        <img 
                            src={stockData.logo} 
                            alt={`${stockData.companyName} logo`} 
                            className="max-w-full max-h-full object-contain" 
                        />
                    </div>
                )}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 w-full">
                    {infoItems.map(item => (
                        <div key={item.label}>
                            <dt className="text-sm text-text-secondary">{item.label}</dt>
                            <dd className="text-base font-semibold text-text-primary mt-1 truncate">
                                {item.isLink && typeof item.value === 'string' ? (
                                    <a href={item.value} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                        {item.value.replace(/^(https?:\/\/)?(www\.)?/, '')}
                                    </a>
                                ) : (
                                    item.value
                                )}
                            </dd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CompanyOverview;