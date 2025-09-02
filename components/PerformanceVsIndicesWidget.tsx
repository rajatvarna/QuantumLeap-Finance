
import React, { useEffect, useRef, memo, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import SkeletonLoader from './SkeletonLoader';

interface PerformanceVsIndicesWidgetProps {
    ticker: string;
}

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
        },
    };
};

const PerformanceVsIndicesWidget: React.FC<PerformanceVsIndicesWidgetProps> = ({ ticker }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef(`tradingview_perf_widget_${Math.random().toString(36).substring(2, 11)}`);
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const createWidget = () => {
            if (!containerRef.current || !isMounted) return;

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
                studies: [
                    "Compare:SPX@tv-basicstudies", // S&P 500
                    "Compare:IXIC@tv-basicstudies", // NASDAQ Composite
                ],
            });
            
            if (isMounted) {
                setIsLoading(false);
            }
        };

        const checkForTradingView = (retries = 10, delay = 300) => {
            if (typeof window.TradingView !== 'undefined' && window.TradingView.widget) {
                createWidget();
            } else if (retries > 0 && isMounted) {
                setTimeout(() => checkForTradingView(retries - 1, delay), delay);
            } else if (isMounted) {
                console.error("TradingView script failed to load for performance chart.");
                setIsLoading(false);
            }
        };

        setIsLoading(true);
        checkForTradingView();

        return () => {
            isMounted = false;
        };
    }, [ticker, theme]);

    return (
        <div className="bg-card border border-border rounded-xl shadow-sm h-[500px] flex flex-col">
             <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Price Performance vs. Indices</h3>
                <p className="text-sm text-text-secondary">Comparing {ticker} with S&P 500 (orange) and NASDAQ Composite (blue).</p>
            </div>
            <div className="flex-grow p-1 relative">
                {isLoading && (
                    <div className="absolute inset-1 flex items-center justify-center bg-card rounded-lg">
                        <SkeletonLoader className="w-full h-full" />
                    </div>
                )}
                <div ref={containerRef} id={widgetIdRef.current} className="w-full h-full" style={{ visibility: isLoading ? 'hidden' : 'visible' }} />
            </div>
        </div>
    );
};

export default memo(PerformanceVsIndicesWidget);
