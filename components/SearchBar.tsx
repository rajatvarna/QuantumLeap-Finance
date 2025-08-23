
import React, { useState } from 'react';

interface SearchBarProps {
    setTicker: (ticker: string) => void;
    initialTicker: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ setTicker, initialTicker }) => {
    const [inputValue, setInputValue] = useState(initialTicker);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setTicker(inputValue.trim().toUpperCase());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter stock ticker (e.g., GOOGL)"
                className="w-full max-w-sm bg-brand-secondary border border-brand-border rounded-md px-4 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <button
                type="submit"
                className="bg-brand-accent hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Search
            </button>
        </form>
    );
};

export default SearchBar;
