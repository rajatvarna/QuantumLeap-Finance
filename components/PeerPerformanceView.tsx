import React, { useEffect, useRef, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPeers } from '../services/finnhubService';
import { SubscriptionPlan } from '../types';
import FeatureGate from './FeatureGate';
import SkeletonLoader from './SkeletonLoader';
import { useTheme } from '../hooks/useTheme';

interface PeerPerformanceViewProps {
    ticker: string;
}

declare global {
    interface Window {
        TradingView: any;
    }
}

const PeerPerformanceChart: React.FC<{ ticker: string; peers: string[] }> = memo(({ ticker, peers }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        let isMounted = true;
        
        const createWidget = () => {
             if (!containerRef.current || !isMounted || typeof window.TradingView === 'undefined' || !window.TradingView.widget) {
                return;
            }
            
            const script = document.createElement('script');
            script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-comparison.js";
            script.async = true;
            
            const symbols = [
                { "s": ticker, "d": `${ticker} (Primary)` },
                ...peers.slice(0, 5).map(p => ({ "s": p, "d": p })) // Limit to 5 peers for clarity
            ];
            
            script.innerHTML = JSON.stringify({
                "width": "100%",
                "height": "100%",
                "symbols": symbols,
                "chartType": "line",
                "style": "1",
                "locale": "en",
                "isTransparent": true,
                "autosize": true,
                "showSymbolLogo": true,
                "colorTheme": theme,
                "fontColor": theme === 'dark' ? "#9CA3AF" : "#6B7280",
                "gridLineColor": theme === 'dark' ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                "trendLineColor": theme === 'dark' ? "#3B82F6" : "#3B82F6",
                "underLineColor": "rgba(59, 130, 246, 0.15)",
            });
            
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(script);
        };
        
        if (typeof window.TradingView !== 'undefined' && window.TradingView.widget) {
            createWidget();
        } else {
            const mainScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
            const listener = () => { if (isMounted) createWidget(); };
            mainScript?.addEventListener('load', listener);
            return () => { isMounted = false; mainScript?.removeEventListener('load', listener); };
        }
        
        return () => { isMounted = false; };

    }, [ticker, peers, theme]);

    return <div ref={containerRef} className="h-full w-full" />;
});


const PeerPerformanceViewContent: React.FC<PeerPerformanceViewProps> = ({ ticker }) => {
    const { data: peers, isLoading, isError, error, refetch } = useQuery<string[], Error>({
        queryKey: ['peers', ticker],
        queryFn: () => fetchPeers(ticker),
    });

    if (isLoading) {
        return (
             <div className="bg-card border border-border rounded-xl p-4 sm:p-6 h-[500px]">
                <SkeletonLoader className="h-full w-full" />
            </div>
        );
    }
    
    if (isError) {
        return (
            <div className="text-center p-8 bg-card border border-border rounded-xl">
                <p className="text-negative font-semibold">Could not load peer data.</p>
                <p className="text-text-secondary text-sm mt-1">{(error as any)?.message}</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    aria-label="Retry fetching peer data"
                >
                    Retry
                </button>
            </div>
        );
    }
    
    if (!peers || peers.length === 0) {
        return <div className="text-center text-text-secondary p-4 bg-card border border-border rounded-xl">No industry peer data found for this stock.</div>;
    }

    return (
        <div className="bg-card border border-border rounded-xl h-[500px] flex flex-col">
             <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Performance vs. Peers (1Y)</h3>
            </div>
            <div className="flex-grow p-1">
                <PeerPerformanceChart ticker={ticker} peers={peers} />
            </div>
        </div>
    );
};

const PeerPerformanceView: React.FC<PeerPerformanceViewProps> = ({ ticker }) => {
    return (
        <FeatureGate requiredPlan={SubscriptionPlan.PRO}>
            <PeerPerformanceViewContent ticker={ticker} />
        </FeatureGate>
    );
};

export default PeerPerformanceView;