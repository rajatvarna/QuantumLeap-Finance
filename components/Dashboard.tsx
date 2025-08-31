import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStockData } from '../services/finnhubService';
import StockHeader from './StockHeader';
import StockChart from './StockChart';
import FilingsTable from './FilingsTable';
import NewsFeed from './NewsFeed';
import CompanyOverview from './CompanyOverview';
import FinancialsView from './FinancialsView';
import TranscriptsView from './TranscriptsView';
import InsiderTransactionsView from './InsiderTransactionsView';
import SkeletonLoader from './SkeletonLoader';
import PerformanceWidget from './PerformanceWidget';
import TradingViewAdvancedWidgets from './TradingViewAdvancedWidgets';


interface DashboardProps {
    ticker: string;
}

const Dashboard: React.FC<DashboardProps> = ({ ticker }) => {
    const [activeTab, setActiveTab] = useState('Overview');

    // Primary data fetch to act as a gatekeeper.
    // If this fails, especially with a 401, we can show a top-level error.
    const { isError, error, isLoading } = useQuery({
        queryKey: ['stockData', ticker],
        queryFn: () => fetchStockData(ticker),
        staleTime: Infinity,
    });

    if (isLoading) {
        return (
            <div className="space-y-8">
                <SkeletonLoader className="h-36 w-full rounded-xl" />
                <SkeletonLoader className="h-10 w-full rounded-lg" />
                 <div className="space-y-8">
                    <SkeletonLoader className="h-40 w-full rounded-xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       <SkeletonLoader className="h-[500px] w-full rounded-xl" />
                       <SkeletonLoader className="h-[500px] w-full rounded-xl" />
                    </div>
                 </div>
            </div>
        );
    }
    
    if (isError) {
        const errorMessage = (error as any)?.status === 401
            ? "API key is invalid or missing. Please check your configuration."
            : `Failed to fetch data for ${ticker}. Please try again.`;
            
        return (
            <div className="p-6 bg-card rounded-xl border border-negative/50 text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-negative/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">Could not load data</h3>
                <p className="mt-2 text-text-secondary">{errorMessage}</p>
            </div>
        );
    }

    const tabs = ['Overview', 'Financials', 'Transcripts', 'Insider Activity'];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Financials':
                return <FinancialsView ticker={ticker} />;
            case 'Transcripts':
                return <TranscriptsView ticker={ticker} />;
            case 'Insider Activity':
                return <InsiderTransactionsView ticker={ticker} />;
            case 'Overview':
            default:
                return (
                    <div className="space-y-8">
                        <CompanyOverview ticker={ticker} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <StockChart ticker={ticker} />
                            <NewsFeed ticker={ticker} />
                        </div>
                        <TradingViewAdvancedWidgets ticker={ticker} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <FilingsTable ticker={ticker} />
                             <PerformanceWidget ticker={ticker} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8">
            <StockHeader ticker={ticker} />

            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300 dark:hover:border-gray-700'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            aria-current={activeTab === tab ? 'page' : undefined}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default Dashboard;