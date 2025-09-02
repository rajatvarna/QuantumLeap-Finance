

import React, { useEffect, useRef, memo, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import SkeletonLoader from './SkeletonLoader';

interface StockChartProps {
    ticker: string;
}

// Extend the Window interface to include the TradingView object for TypeScript
declare global {
    interface Window {
        TradingView: any;
    }
}

const getThemeOptions = (theme: 'light' | 'dark') => {
    const isDark = theme === 'dark';
    return {
        theme: isDark ? "dark" : "light",
        overrides: {
            "paneProperties.background": isDark ? "rgb(31 41 55)" : "#FFFFFF",
            "paneProperties.vertGridProperties.color": isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            "paneProperties.horzGridProperties.color": isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            "symbolWatermarkProperties.color": isDark ? "rgba(229, 231, 235, 0.05)" : "rgba(0, 0, 0, 0.05)",
            "scalesProperties.textColor": isDark ? "#9CA3AF" : "#6B7280",
            "mainSeriesProperties.candleStyle.upColor": isDark ? "#4ADF8C" : "#15803D",
            "mainSeriesProperties.candleStyle.downColor": isDark ? "#F87171" : "#B91C1C",
            "mainSeriesProperties.candleStyle.borderUpColor": isDark ? "#4ADF8C" : "#15803D",
            "mainSeriesProperties.candleStyle.borderDownColor": isDark ? "#F87171" : "#B91C1C",
            "mainSeriesProperties.candleStyle.wickUpColor": isDark ? "#4ADF8C" : "#15803D",
            "mainSeriesProperties.candleStyle.wickDownColor": isDark ? "#F87171" : "#B91C1C",
        },
    };
};


const StockChart: React.FC<StockChartProps> = ({ ticker }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef(`tradingview_widget_container_${Math.random().toString(36).substring(2, 11)}`);
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const createWidget = () => {
            if (!containerRef.current || !isMounted) return;

            try {
                containerRef.current.innerHTML = '';
                const themeOptions = getThemeOptions(theme);

                new window.TradingView.widget({
                    autosize: true,
                    symbol: ticker,
                    interval: "D",
                    timezone: "Etc/UTC",
                    style: "1",
                    locale: "en",
                    enable_publishing: false,
                    allow_symbol_change: true,
                    ...themeOptions,
                    container_id: widgetIdRef.current,
                });
                
                if (isMounted) {
                    setIsLoading(false);
                    setError(null);
                }
            } catch (e) {
                console.error("TradingView Widget Error:", e);
                if (isMounted) {
                    setError("An error occurred while initializing the chart.");
                    setIsLoading(false);
                }
            }
        };

        const checkForTradingView = (retries = 10, delay = 300) => {
            if (typeof window.TradingView !== 'undefined' && window.TradingView.widget) {
                createWidget();
            } else if (retries > 0 && isMounted) {
                setTimeout(() => checkForTradingView(retries - 1, delay), delay);
            } else if (isMounted) {
                console.error("TradingView script failed to load.");
                setError("Charting library failed to load. Check your network or ad blocker.");
                setIsLoading(false);
            }
        };

        setIsLoading(true);
        setError(null);
        checkForTradingView();

        return () => {
            isMounted = false;
        };
    }, [ticker, theme]);

    return (
        <div className="bg-card border border-border rounded-xl shadow-sm h-[500px] flex flex-col transition-colors duration-300">
             <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Price History</h3>
            </div>
            <div className="flex-grow p-1 relative">
                {isLoading && (
                    <div className="absolute inset-1 flex items-center justify-center bg-card rounded-lg">
                        <SkeletonLoader className="w-full h-full" />
                    </div>
                )}
                {error && (
                    <div className="absolute inset-1 flex items-center justify-center bg-card rounded-lg">
                        <div className="text-center p-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-negative/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="mt-4 font-semibold text-text-primary">Could not load chart</p>
                            <p className="mt-1 text-sm text-text-secondary">{error}</p>
                        </div>
                    </div>
                )}
                <div ref={containerRef} id={widgetIdRef.current} className="w-full h-full" style={{ visibility: isLoading || error ? 'hidden' : 'visible' }} />
            </div>
        </div>
    );
};

export default memo(StockChart);