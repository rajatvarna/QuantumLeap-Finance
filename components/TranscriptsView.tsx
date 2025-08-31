import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLatestTranscript } from '../services/finnhubService';
import type { EarningsTranscript } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';

interface TranscriptsViewProps {
    ticker: string;
}

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
                    {new Date(transcript.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {!isNaN(transcript.eps) && ` | Reported EPS: $${transcript.eps.toFixed(2)}`}
                </p>
            </div>
            <div className="p-4 sm:p-6 max-h-[600px] overflow-y-auto">
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