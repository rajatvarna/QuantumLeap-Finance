import React, { useEffect, useRef, memo } from 'react';

interface StockChartProps {
    ticker: string;
}

// Extend the Window interface to include the TradingView object for TypeScript
declare global {
    interface Window {
        TradingView: any;
    }
}

const StockChart: React.FC<StockChartProps> = ({ ticker }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // Use a ref to store a stable, unique ID for the widget container
    const widgetIdRef = useRef(`tradingview_widget_container_${Math.random().toString(36).substring(2, 11)}`);

    useEffect(() => {
        // Ensure the container is rendered and the TradingView library is loaded
        if (!containerRef.current || typeof window.TradingView === 'undefined') {
            return;
        }

        // Clear any existing widget before creating a new one, essential for when the ticker changes
        containerRef.current.innerHTML = '';

        // Create the TradingView widget
        new window.TradingView.widget({
            autosize: true,
            symbol: ticker,
            interval: "D",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            enable_publishing: false,
            allow_symbol_change: true,
            // Override default colors to match the app's brand aesthetic
            overrides: {
                "paneProperties.background": "#161B22", // brand-secondary
                "paneProperties.vertGridProperties.color": "#30363D", // brand-border
                "paneProperties.horzGridProperties.color": "#30363D", // brand-border
                "symbolWatermarkProperties.color": "rgba(201, 209, 217, 0.1)", // brand-text-primary with low alpha
                "scalesProperties.textColor": "#8B949E", // brand-text-secondary
            },
            container_id: widgetIdRef.current,
        });

    }, [ticker]); // Re-run the effect when the ticker symbol changes

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border">
            <h3 className="text-lg font-semibold mb-4 text-white">Price History</h3>
            {/* The container for the TradingView widget. Increased height for better usability. */}
            <div ref={containerRef} id={widgetIdRef.current} style={{ width: '100%', height: 500 }} />
        </div>
    );
};

// Use React.memo to prevent unnecessary re-renders if the ticker prop hasn't changed.
export default memo(StockChart);