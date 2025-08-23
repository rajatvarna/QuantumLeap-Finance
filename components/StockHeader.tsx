
import React from 'react';
import type { StockData } from '../types';

interface StockHeaderProps {
    stockData: StockData;
}

const StockHeader: React.FC<StockHeaderProps> = ({ stockData }) => {
    const isPositive = stockData.change >= 0;

    return (
        <div className="p-4 bg-brand-secondary rounded-lg border border-brand-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">{stockData.companyName} ({stockData.ticker})</h2>
                    <div className="flex items-center space-x-4 text-brand-text-secondary text-sm mt-2">
                        <span>Market Cap: <span className="font-semibold text-brand-text-primary">{stockData.marketCap}</span></span>
                        <span>P/E Ratio: <span className="font-semibold text-brand-text-primary">{stockData.peRatio.toFixed(2)}</span></span>
                    </div>
                </div>
                <div className="mt-4 sm:mt-0 text-right">
                    <p className="text-4xl font-semibold text-white">${stockData.price.toFixed(2)}</p>
                    <p className={`text-lg font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{stockData.change.toFixed(2)} ({isPositive ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StockHeader;
