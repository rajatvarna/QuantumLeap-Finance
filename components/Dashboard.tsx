import React from 'react';
import StockHeader from './StockHeader';
import StockChart from './StockChart';
import FilingsTable from './FilingsTable';
import NewsFeed from './NewsFeed';
import Fundamentals from './Fundamentals';

interface DashboardProps {
    ticker: string;
}

const Dashboard: React.FC<DashboardProps> = ({ ticker }) => {
    return (
        <div className="space-y-8">
            <StockHeader ticker={ticker} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <StockChart ticker={ticker} />
                    <Fundamentals ticker={ticker} />
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <NewsFeed ticker={ticker} />
                    <FilingsTable ticker={ticker} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
