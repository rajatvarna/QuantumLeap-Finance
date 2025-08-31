
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { fetchFilings } from '../services/finnhubService';
import type { Filing } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';
import { useSort } from '../hooks/useSort';
import SortIcon from './SortIcon';

interface FilingsTableProps {
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

interface FilingsTableContentProps extends FilingsTableProps {
    setHeaderActions: (node: React.ReactNode) => void;
}

const FilingsTableContent: React.FC<FilingsTableContentProps> = ({ ticker, setHeaderActions }) => {
    const { data: filings, isLoading, isError } = useQuery<Filing[], Error>({
        queryKey: ['filings', ticker],
        queryFn: () => fetchFilings(ticker),
    });

    const { items: sortedFilings, requestSort, sortConfig } = useSort(filings, { key: 'date', direction: 'desc' });

    const handleExport = () => {
        if (!sortedFilings || sortedFilings.length === 0) return;

        const headers = ['date', 'type', 'headline', 'link'];
        const csvContent = [
            headers.join(','),
            ...sortedFilings.map(f =>
                headers.map(header => escapeCsvValue(f[header as keyof Filing])).join(',')
            )
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${ticker}-filings.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    useEffect(() => {
        if (filings && filings.length > 0) {
            setHeaderActions(
                <button
                    onClick={handleExport}
                    className="flex items-center text-sm bg-transparent border border-accent text-accent hover:bg-accent/10 font-bold py-1.5 px-3 rounded-md transition-colors duration-200"
                    aria-label="Export filings to CSV"
                >
                    <DownloadIcon />
                    <span className="hidden sm:inline ml-2">Export</span>
                </button>
            );
        } else {
            setHeaderActions(null);
        }

        return () => setHeaderActions(null);
    }, [filings, setHeaderActions, sortedFilings]);


    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: sortedFilings?.length ?? 0,
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

    if (!sortedFilings || sortedFilings.length === 0) {
        return <div className="text-center text-text-secondary p-4">No recent filings found.</div>;
    }
    
    const SortableHeader: React.FC<{ sortKey: keyof Filing; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th scope="col" className="px-6 py-3 font-medium">
            <button className="flex items-center uppercase" onClick={() => requestSort(sortKey)}>
                {children}
                <SortIcon
                    isActive={sortConfig?.key === sortKey}
                    direction={sortConfig?.key === sortKey ? sortConfig.direction : null}
                />
            </button>
        </th>
    );

    return (
        <div ref={parentRef} className="overflow-auto h-full">
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-tertiary uppercase bg-card" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                            <SortableHeader sortKey="date">Date</SortableHeader>
                            <SortableHeader sortKey="type">Type</SortableHeader>
                            <th scope="col" className="px-6 py-3 font-medium">Headline</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                            const filing = sortedFilings[virtualItem.index];
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
    const [headerActions, setHeaderActions] = useState<React.ReactNode>(null);

    return (
        <div className="bg-card border border-border rounded-xl h-[500px] flex flex-col">
             <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">Recent Filings</h3>
                <div>{headerActions}</div>
            </div>
            <div className="flex-grow overflow-hidden">
                <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                    <FilingsTableContent ticker={ticker} setHeaderActions={setHeaderActions} />
                </FeatureGate>
            </div>
        </div>
    );
};

export default FilingsTable;
