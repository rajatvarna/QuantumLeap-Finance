import React, { useState } from 'react';
import StockHeader from './StockHeader';
import StockChart from './StockChart';
import FilingsTable from './FilingsTable';
import NewsFeed from './NewsFeed';
import CompanyOverview from './CompanyOverview';
import FinancialsView from './FinancialsView';

interface DashboardProps {
    ticker: string;
}

const Dashboard: React.FC<DashboardProps> = ({ ticker }) => {
    const [activeTab, setActiveTab] = useState('Overview');

    const tabs = ['Overview', 'Financials'];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Financials':
                return <FinancialsView ticker={ticker} />;
            case 'Overview':
            default:
                return (
                    <div className="space-y-8">
                        <CompanyOverview ticker={ticker} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <StockChart ticker={ticker} />
                            <NewsFeed ticker={ticker} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8">
            <StockHeader ticker={ticker} />

            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
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