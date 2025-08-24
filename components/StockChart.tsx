
import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '../hooks/useTheme';

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
            "paneProperties.background": isDark ? "#10141B" : "#FFFFFF",
            "paneProperties.vertGridProperties.color": isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            "paneProperties.horzGridProperties.color": isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            "symbolWatermarkProperties.color": isDark ? "rgba(229, 231, 235, 0.05)" : "rgba(0, 0, 0, 0.05)",
            "scalesProperties.textColor": isDark ? "#9CA3AF" : "#6B7280",
            "mainSeriesProperties.candleStyle.upColor": isDark ? "#22C55E" : "#16A34A",
            "mainSeriesProperties.candleStyle.downColor": isDark ? "#EF4444" : "#DC2626",
            "mainSeriesProperties.candleStyle.borderUpColor": isDark ? "#22C55E" : "#16A34A",
            "mainSeriesProperties.candleStyle.borderDownColor": isDark ? "#EF4444" : "#DC2626",
            "mainSeriesProperties.candleStyle.wickUpColor": isDark ? "#22C55E" : "#16A34A",
            "mainSeriesProperties.candleStyle.wickDownColor": isDark ? "#EF4444" : "#DC2626",
        },
    };
};


const StockChart: React.FC<StockChartProps> = ({ ticker }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef(`tradingview_widget_container_${Math.random().toString(36).substring(2, 11)}`);
    const { theme } = useTheme();

    useEffect(() => {
        if (!containerRef.current || typeof window.TradingView === 'undefined') {
            return;
        }

        // Clear previous widget
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

    }, [ticker, theme]);

    return (
        <div className="bg-card border border-border rounded-xl shadow-lg h-[500px] flex flex-col transition-colors duration-300">
             <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Price History</h3>
            </div>
            <div className="flex-grow p-1">
                <div ref={containerRef} id={widgetIdRef.current} className="w-full h-full" />
            </div>
        </div>
    );
};

export default memo(StockChart);