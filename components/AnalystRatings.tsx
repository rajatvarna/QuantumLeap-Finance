import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAnalystRatings } from '../services/finnhubService';
import type { AnalystRating } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';

interface AnalystRatingsProps {
    ticker: string;
}

const ratingColors = {
    strongBuy: 'bg-emerald-600',
    buy: 'bg-emerald-400',
    hold: 'bg-yellow-500',
    sell: 'bg-red-400',
    strongSell: 'bg-red-600',
};

const ratingLabels = {
    strongBuy: 'Strong Buy',
    buy: 'Buy',
    hold: 'Hold',
    sell: 'Sell',
    strongSell: 'Strong Sell',
};

const getConsensus = (rating: AnalystRating) => {
    const buySide = rating.strongBuy + rating.buy;
    const sellSide = rating.strongSell + rating.sell;

    if (buySide > sellSide && buySide > rating.hold) {
        return { text: 'Buy', color: 'bg-positive', textColor: 'text-positive' };
    }
    if (sellSide > buySide && sellSide > rating.hold) {
        return { text: 'Sell', color: 'bg-negative', textColor: 'text-negative' };
    }
    return { text: 'Hold', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
};

const AnalystRatingsContent: React.FC<AnalystRatingsProps> = ({ ticker }) => {
    const { data: ratings, isLoading, isError, refetch } = useQuery<AnalystRating[], Error>({
        queryKey: ['analystRatings', ticker],
        queryFn: () => fetchAnalystRatings(ticker),
    });

    const [isAnimated, setIsAnimated] = React.useState(false);
    React.useEffect(() => {
        // Trigger animation shortly after mount
        const timer = setTimeout(() => setIsAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-4 h-full flex flex-col">
                <SkeletonLoader className="h-20 w-full flex-shrink-0" />
                 <div className="flex-grow flex justify-between items-end h-full gap-2 pt-4">
                    {[...Array(12)].map((_, i) => <SkeletonLoader key={i} className="w-full" style={{ height: `${20 + Math.random() * 60}%`}} />)}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center p-4 flex flex-col items-center justify-center h-full">
                <p className="text-negative">Could not load analyst ratings.</p>
                <button
                    onClick={() => refetch()}
                    className="mt-2 text-sm bg-accent hover:bg-accent-hover text-white font-bold py-1 px-3 rounded-md transition-colors duration-200"
                    aria-label="Retry fetching ratings"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!ratings || ratings.length === 0) {
        return <div className="text-center text-text-secondary p-4 flex items-center justify-center h-full">No analyst ratings found.</div>;
    }

    const latestRating = ratings[0];
    const historicalRatings = [...ratings].reverse(); // Oldest to newest for chart
    const maxTotalAnalysts = Math.max(...historicalRatings.map(r => r.strongBuy + r.buy + r.hold + r.sell + r.strongSell), 0);
    const consensus = getConsensus(latestRating);
    const totalAnalystsLatest = latestRating.strongBuy + latestRating.buy + latestRating.hold + latestRating.sell + latestRating.strongSell;

    return (
        <div className="p-4 sm:p-6 flex flex-col h-full">
            {/* Latest Rating Summary */}
            <div className="mb-6 flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-sm text-text-secondary">Consensus Rating</p>
                        <p className={`text-3xl font-bold ${consensus.textColor}`}>{consensus.text}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-text-secondary">Based on</p>
                        <p className="text-3xl font-bold text-text-primary">{totalAnalystsLatest}</p>
                        <p className="text-sm text-text-secondary">analysts</p>
                    </div>
                </div>
                <div className="flex w-full h-3 rounded-full overflow-hidden bg-background">
                    {(Object.keys(ratingColors) as (keyof typeof ratingColors)[]).map(key => (
                        latestRating[key] > 0 && (
                            <div
                                key={key}
                                className={ratingColors[key]}
                                style={{ width: `${(latestRating[key] / totalAnalystsLatest) * 100}%` }}
                                title={`${ratingLabels[key]}: ${latestRating[key]}`}
                            />
                        )
                    ))}
                </div>
                 <div className="flex flex-wrap justify-between text-xs mt-2 text-text-secondary">
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5"></span>Strong Buy ({latestRating.strongBuy})</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span>Buy ({latestRating.buy})</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>Hold ({latestRating.hold})</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1.5"></span>Sell ({latestRating.sell})</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-600 mr-1.5"></span>Strong Sell ({latestRating.strongSell})</div>
                 </div>
            </div>

            {/* Historical Trends Chart */}
            <div className="flex-grow flex flex-col min-h-0">
                <p className="text-sm text-text-secondary mb-2">Historical Trends</p>
                <div className="flex-grow flex gap-2 items-end">
                    {historicalRatings.map((rating, index) => {
                        const total = rating.strongBuy + rating.buy + rating.hold + rating.sell + rating.strongSell;
                        const barHeight = total > 0 && maxTotalAnalysts > 0 ? (total / maxTotalAnalysts) * 100 : 0;
                        const periodDate = new Date(rating.period);
                        const periodLabel = periodDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                        return (
                            <div key={index} className="h-full flex-1 flex flex-col justify-end items-center group relative">
                                <div 
                                    className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden transition-all duration-700 ease-out" 
                                    style={{ height: isAnimated ? `${barHeight}%` : '0%' }}
                                >
                                    {(Object.keys(ratingColors) as (keyof typeof ratingColors)[]).map(key => (
                                        rating[key] > 0 && (
                                            <div
                                                key={key}
                                                className={`${ratingColors[key]} transition-transform duration-200 group-hover:scale-y-105 group-hover:brightness-110`}
                                                style={{ height: total > 0 ? `${(rating[key] / total) * 100}%` : '0%' }}
                                            />
                                        )
                                    ))}
                                </div>
                                <span className="text-xs text-text-tertiary mt-1 whitespace-nowrap transform -rotate-45 ">{periodLabel}</span>
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 w-48 bg-card border border-border p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                    <p className="font-bold text-text-primary text-sm mb-1">{periodLabel}</p>
                                    {(Object.keys(ratingLabels) as (keyof typeof ratingLabels)[]).map(key => (
                                        <div key={key} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center">
                                                <span className={`w-2 h-2 rounded-full ${ratingColors[key]} mr-1.5`}></span>
                                                <span className="text-text-secondary">{ratingLabels[key]}</span>
                                            </div>
                                            <span className="font-semibold text-text-primary">{rating[key]}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-border mt-1 pt-1 flex justify-between items-center text-xs">
                                         <span className="text-text-secondary font-bold">Total</span>
                                         <span className="font-bold text-text-primary">{total}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


const AnalystRatings: React.FC<AnalystRatingsProps> = ({ ticker }) => {
    return (
        <div className="bg-card border border-border rounded-xl shadow-sm h-[500px] flex flex-col">
             <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">Analyst Ratings</h3>
            </div>
            <div className="flex-grow overflow-hidden">
                <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
                    <AnalystRatingsContent ticker={ticker} />
                </FeatureGate>
            </div>
        </div>
    );
};

export default AnalystRatings;