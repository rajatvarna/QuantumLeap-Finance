
import React, { useState } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
    const [ticker, setTicker] = useState<string>('AAPL');

    return (
        <ThemeProvider>
            <AuthProvider>
                <div className="min-h-screen bg-background text-text-primary font-sans transition-colors duration-300">
                    <Header />
                    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                        <SearchBar setTicker={setTicker} initialTicker={ticker} />
                        <div className="mt-6">
                            <Dashboard key={ticker} ticker={ticker} />
                        </div>
                    </main>
                </div>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;