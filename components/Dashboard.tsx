import React from 'react';
import StockHeader from './StockHeader';
import StockChart from './StockChart';
import FilingsTable from './FilingsTable';
import NewsFeed from './NewsFeed';
import Fundamentals from './Fundamentals';
import CompanyOverview from './CompanyOverview';

interface DashboardProps {
    ticker: string;
}

const Dashboard: React.FC<DashboardProps> = ({ ticker }) => {
    return (
        <div className="space-y-8">
            <StockHeader ticker={ticker} />
            <CompanyOverview ticker={ticker} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <StockChart ticker={ticker} />
                <NewsFeed ticker={ticker} />
                <Fundamentals ticker={ticker} />
                <FilingsTable ticker={ticker} />
            </div>
        </div>
    );
};

export default Dashboard;