import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '../hooks/useTheme';

interface TradingViewWidgetProps {
    ticker: string;
    widgetOptions: Record<string, any>;
}

declare global {
    interface Window {
        TradingView: any;
    }
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = memo(({ ticker, widgetOptions }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        let isMounted = true;

        const createWidget = () => {
            if (!containerRef.current || !isMounted || typeof window.TradingView === 'undefined' || !window.TradingView.widget) {
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                ...widgetOptions,
                symbol: ticker,
                colorTheme: theme,
            });

            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(script);
        };
        
        if (typeof window.TradingView !== 'undefined' && window.TradingView.widget) {
            createWidget();
        } else {
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

    return <div ref={containerRef} className="h-full w-full" />;
});

interface CompanyProfileWidgetProps {
    ticker: string;
}

const CompanyProfileWidget: React.FC<CompanyProfileWidgetProps> = ({ ticker }) => {
    const profileOptions = {
        width: "100%",
        height: "100%",
        isTransparent: true,
        locale: "en",
    };

    return (
        <div className="bg-card border border-border rounded-xl h-[500px] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Company Profile</h3>
            </div>
             <div className="flex-grow p-1">
                 <TradingViewWidget ticker={ticker} widgetOptions={profileOptions} />
            </div>
        </div>
    );
};

export default memo(CompanyProfileWidget);