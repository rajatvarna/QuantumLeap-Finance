import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTranscripts } from '../services/finnhubService';
import type { Transcript } from '../types';
import { SubscriptionPlan } from '../types';
import SkeletonLoader from './SkeletonLoader';
import FeatureGate from './FeatureGate';

interface TranscriptsViewProps {
    ticker: string;
}

const TranscriptsViewContent: React.FC<TranscriptsViewProps> = ({ ticker }) => {
    const { data: transcripts, isLoading, isError } = useQuery<Transcript[], Error>({
        queryKey: ['transcripts', ticker],
        queryFn: () => fetchTranscripts(ticker),
    });

    if (isLoading) {
        return (
             <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i}>
                        <SkeletonLoader className="h-5 w-3/4 mb-2" />
                        <SkeletonLoader className="h-4 w-1/4" />
                    </div>
                ))}
            </div>
        );
    }
    
    if (isError) {
        return <div className="text-center text-negative p-4 bg-card border border-border rounded-xl">Could not load earnings call transcripts.</div>;
    }
    
    if (!transcripts || transcripts.length === 0) {
        return <div className="text-center text-text-secondary p-4 bg-card border border-border rounded-xl">No earnings call transcripts found.</div>;
    }

    return (
        <div className="bg-card border border-border rounded-xl">
             <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Earnings Call Transcripts</h3>
            </div>
            <ul className="divide-y divide-border">
                {transcripts.map((transcript) => (
                    <li key={transcript.id} className="p-4 sm:p-6 hover:bg-background transition-colors">
                        <p className="font-semibold text-text-primary">{transcript.title}</p>
                        <p className="text-sm text-text-secondary mt-1">
                            Q{transcript.quarter} {transcript.year} - {new Date(transcript.time).toLocaleDateString()}
                        </p>
                    </li>
                ))}
            </ul>
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
