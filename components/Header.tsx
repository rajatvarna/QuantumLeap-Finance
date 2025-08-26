
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { SubscriptionPlan } from '../types';

const Header: React.FC = () => {
    const { user, login, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const SunIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );

    const MoonIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    );

    return (
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border shadow-md transition-colors duration-300">
            <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
                <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h1 className="text-xl font-bold text-text-primary">QuantumLeap Finance</h1>
                </div>
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${user.plan === SubscriptionPlan.PRO ? 'bg-accent/20 text-accent' : 'bg-gray-200 dark:bg-gray-700 text-text-secondary'}`}>
                                {user.plan} Plan
                            </span>
                            <button
                                onClick={logout}
                                className="text-sm bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                         <div className="flex items-center space-x-2">
                            <button
                                onClick={() => login(SubscriptionPlan.FREE)}
                                className="text-sm bg-transparent border border-accent text-accent hover:bg-accent/10 font-bold py-2 px-4 rounded-md transition-colors duration-200"
                            >
                                Login (Free)
                            </button>
                            <button
                                onClick={() => login(SubscriptionPlan.PRO)}
                                className="text-sm bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                            >
                                Login (Pro)
                            </button>
                        </div>
                    )}
                     <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-background transition-colors duration-200"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
