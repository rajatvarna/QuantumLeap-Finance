import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFilings } from '../services/finnhubService';
import type { Filing } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';

interface FilingsTableProps {
    ticker: string;
}

const FilingsTableContent: React.FC<FilingsTableProps> = ({ ticker }) => {
    const { data: filings, isLoading, isError } = useQuery<Filing[], Error>({
        queryKey: ['filings', ticker],
        queryFn: () => fetchFilings(ticker),
    });

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <SkeletonLoader key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }
    
    if (isError) {
        return <div className="text-center text-red-400 p-4">Could not load company filings.</div>;
    }

    if (!filings || filings.length === 0) {
        return <div className="text-center text-brand-text-secondary p-4">No recent filings found.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-brand-text-secondary">
                <thead className="text-xs text-brand-text-primary uppercase bg-brand-primary">
                    <tr>
                        <th scope="col" className="px-4 py-3">Date</th>
                        <th scope="col" className="px-4 py-3">Type</th>
                        <th scope="col" className="px-4 py-3">Headline</th>
                    </tr>
                </thead>
                <tbody>
                    {filings.map((filing, index) => (
                        <tr key={index} className="border-b border-brand-border hover:bg-brand-primary">
                            <td className="px-4 py-3 whitespace-nowrap">{filing.date}</td>
                            <td className="px-4 py-3">
                                <span className="bg-gray-700 text-gray-300 text-xs font-medium px-2 py-1 rounded-full">{filing.type}</span>
                            </td>
                            <td className="px-4 py-3">
                                <a href={filing.link} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-accent hover:underline">
                                    {filing.headline}
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const FilingsTable: React.FC<FilingsTableProps> = ({ ticker }) => {
    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border">
            <h3 className="text-lg font-semibold mb-4 text-white">Recent Filings</h3>
            <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                <FilingsTableContent ticker={ticker} />
            </FeatureGate>
        </div>
    );
};

export default FilingsTable;