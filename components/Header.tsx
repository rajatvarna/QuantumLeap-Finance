
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { SubscriptionPlan } from '../types';

const Header: React.FC = () => {
    const { user, togglePlan } = useAuth();

    return (
        <header className="bg-brand-secondary border-b border-brand-border p-4 shadow-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h1 className="text-xl font-bold text-brand-text-primary">QuantumLeap Finance</h1>
                </div>
                {user && (
                    <div className="flex items-center space-x-4">
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${user.plan === SubscriptionPlan.PRO ? 'bg-blue-500 text-white' : 'bg-gray-700 text-brand-text-secondary'}`}>
                            {user.plan} Plan
                        </span>
                        <button
                            onClick={togglePlan}
                            className="text-sm bg-brand-accent hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                        >
                            Toggle Plan
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
