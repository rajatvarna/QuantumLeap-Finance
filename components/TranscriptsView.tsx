import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLatestTranscript } from '../services/alphavantageService';
import type { EarningsTranscript } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';

interface TranscriptsViewProps {
    ticker: string;
}

const Disclaimer: React.FC = () => (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md my-4 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600" role="alert">
        <div className="flex">
            <div className="py-1">
                <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg>
            </div>
            <div>
                <p className="font-bold">Demonstration Only</p>
                <p className="text-sm">The earnings data (EPS, date) is real, but full transcript text is a premium feature. The text below is a placeholder to demonstrate UI functionality.</p>
            </div>
        </div>
    </div>
);

const TranscriptsViewContent: React.FC<TranscriptsViewProps> = ({ ticker }) => {
    const { data: transcript, isLoading, isError, error } = useQuery<EarningsTranscript | null, Error>({
        queryKey: ['transcript', ticker],
        queryFn: () => fetchLatestTranscript(ticker),
    });

    if (isLoading) {
        return (
             <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <SkeletonLoader className="h-8 w-1/2 mb-4" />
                <SkeletonLoader className="h-5 w-1/3 mb-6" />
                <div className="space-y-3">
                    <SkeletonLoader className="h-4 w-full" />
                    <SkeletonLoader className="h-4 w-full" />
                    <SkeletonLoader className="h-4 w-3/4" />
                    <SkeletonLoader className="h-4 w-full" />
                </div>
            </div>
        );
    }
    
    if (isError) {
        return <div className="text-center text-negative p-4 bg-card border border-border rounded-xl">Could not load earnings call transcript. {(error as any)?.message}</div>;
    }
    
    if (!transcript) {
        return <div className="text-center text-text-secondary p-4 bg-card border border-border rounded-xl">No recent earnings call transcript found for this stock.</div>;
    }

    return (
        <div className="bg-card border border-border rounded-xl">
             <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-xl font-semibold text-text-primary">Q{transcript.quarter} {transcript.year} Earnings Call Transcript</h3>
                <p className="text-sm text-text-secondary mt-1">
                    {new Date(transcript.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Reported EPS: ${transcript.eps}
                </p>
            </div>
            <div className="p-4 sm:p-6 max-h-[600px] overflow-y-auto">
                <Disclaimer />
                <pre className="text-sm text-text-primary whitespace-pre-wrap font-sans leading-relaxed">
                    {transcript.transcript}
                </pre>
            </div>
        </div>
    );
};

const TranscriptsView: React.FC<TranscriptsViewProps> = ({ ticker }) => {
    return (
        <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
            <TranscriptsViewContent ticker={ticker} />
        </FeatureGate>
    );
};

export default TranscriptsView;