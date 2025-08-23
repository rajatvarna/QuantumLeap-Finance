
import React, { useState } from 'react';
import { AuthProvider } from './hooks/useAuth';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
    const [ticker, setTicker] = useState<string>('AAPL');

    return (
        <AuthProvider>
            <div className="min-h-screen bg-brand-primary text-brand-text-primary font-sans">
                <Header />
                <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    <SearchBar setTicker={setTicker} initialTicker={ticker} />
                    <div className="mt-6">
                        <Dashboard key={ticker} ticker={ticker} />
                    </div>
                </main>
            </div>
        </AuthProvider>
    );
};

export default App;
