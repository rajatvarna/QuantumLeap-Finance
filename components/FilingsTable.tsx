import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
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

    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: filings?.length ?? 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 53, // Estimate row height in pixels
    });

    if (isLoading) {
        return (
            <div className="space-y-2 p-4 sm:p-6">
                {[...Array(5)].map((_, i) => (
                    <SkeletonLoader key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }
    
    if (isError) {
        return <div className="text-center text-negative p-4">Could not load company filings.</div>;
    }

    if (!filings || filings.length === 0) {
        return <div className="text-center text-text-secondary p-4">No recent filings found.</div>;
    }

    return (
        <div ref={parentRef} className="overflow-auto h-full">
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-tertiary uppercase bg-card" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                            <th scope="col" className="px-6 py-3 font-medium">Date</th>
                            <th scope="col" className="px-6 py-3 font-medium">Type</th>
                            <th scope="col" className="px-6 py-3 font-medium">Headline</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                            const filing = filings[virtualItem.index];
                            return (
                                <tr 
                                    key={virtualItem.key} 
                                    style={{ 
                                        position: 'absolute', 
                                        top: 0, 
                                        left: 0, 
                                        width: '100%', 
                                        height: `${virtualItem.size}px`, 
                                        transform: `translateY(${virtualItem.start}px)` 
                                    }}
                                    className="border-b border-border hover:bg-background"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">{filing.date}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-700 text-gray-300 text-xs font-medium px-2 py-1 rounded-full">{filing.type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <a href={filing.link} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
                                            {filing.headline}
                                        </a>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FilingsTable: React.FC<FilingsTableProps> = ({ ticker }) => {
    return (
        <div className="bg-card border border-border rounded-xl h-[500px] flex flex-col">
             <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Recent Filings</h3>
            </div>
            <div className="flex-grow overflow-hidden">
                <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                    <FilingsTableContent ticker={ticker} />
                </FeatureGate>
            </div>
        </div>
    );
};

export default FilingsTable;