import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '../hooks/useTheme';
import SkeletonLoader from './SkeletonLoader';

interface TradingViewAdvancedWidgetsProps {
    ticker: string;
}

interface TradingViewWidgetProps {
    ticker: string;
    widgetOptions: Record<string, any>;
    containerId: string;
}

declare global {
    interface Window {
        TradingView: any;
    }
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = memo(({ ticker, widgetOptions, containerId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        let isMounted = true;

        const createWidget = () => {
            if (!containerRef.current || !isMounted || typeof window.TradingView === 'undefined' || !window.TradingView.widget) {
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
            if (widgetOptions.widgetType === 'profile') {
                 script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
            }
            
            script.async = true;
            script.innerHTML = JSON.stringify({
                ...widgetOptions,
                symbol: ticker,
                colorTheme: theme,
            });

            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(script);
        };
        
        // Ensure the TradingView script is loaded before creating the widget
        if (typeof window.TradingView !== 'undefined' && window.TradingView.widget) {
            createWidget();
        } else {
            // This assumes the main script in index.html will handle loading.
            // A more robust solution might use a script loader hook.
            const mainScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
            const listener = () => {
                if (isMounted) createWidget();
            };
            mainScript?.addEventListener('load', listener);
            
            return () => {
                isMounted = false;
                mainScript?.removeEventListener('load', listener);
            };
        }

        return () => { isMounted = false; };
    }, [ticker, theme, widgetOptions]);

    return <div ref={containerRef} id={containerId} className="h-full w-full" />;
});


const TradingViewAdvancedWidgets: React.FC<TradingViewAdvancedWidgetsProps> = ({ ticker }) => {
    const techAnalysisOptions = {
        interval: "1D",
        width: "100%",
        height: "100%",
        isTransparent: true,
        showIntervalTabs: true,
        locale: "en",
    };

    const profileOptions = {
        width: "100%",
        height: "100%",
        isTransparent: true,
        locale: "en",
        widgetType: 'profile'
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl h-[400px] flex flex-col">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h3 className="text-lg font-semibold text-text-primary">Technical Analysis</h3>
                </div>
                <div className="flex-grow p-1">
                    <TradingViewWidget ticker={ticker} widgetOptions={techAnalysisOptions} containerId={`tv-tech-analysis-${ticker}`} />
                </div>
            </div>
            <div className="bg-card border border-border rounded-xl h-[400px] flex flex-col">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h3 className="text-lg font-semibold text-text-primary">Company Profile</h3>
                </div>
                 <div className="flex-grow p-1">
                     <TradingViewWidget ticker={ticker} widgetOptions={profileOptions} containerId={`tv-profile-${ticker}`} />
                </div>
            </div>
        </div>
    );
};

export default memo(TradingViewAdvancedWidgets);