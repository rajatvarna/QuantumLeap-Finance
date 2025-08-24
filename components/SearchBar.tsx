import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchSymbols } from '../services/finnhubService';
import type { SearchResult } from '../types';

interface SearchBarProps {
    setTicker: (ticker: string) => void;
    initialTicker: string;
}

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const SearchBar: React.FC<SearchBarProps> = ({ setTicker, initialTicker }) => {
    const [inputValue, setInputValue] = useState(initialTicker);
    const [isFocused, setIsFocused] = useState(false);
    const debouncedSearchTerm = useDebounce(inputValue, 300);
    const searchRef = useRef<HTMLDivElement>(null);

    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['search', debouncedSearchTerm],
        queryFn: () => searchSymbols(debouncedSearchTerm),
        enabled: debouncedSearchTerm.length > 1 && isFocused && debouncedSearchTerm !== initialTicker,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setTicker(inputValue.trim().toUpperCase());
            setIsFocused(false);
        }
    };

    const handleSelectTicker = (result: SearchResult) => {
        setInputValue(result.symbol);
        setTicker(result.symbol);
        setIsFocused(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const showResults = isFocused && inputValue.length > 1 && inputValue !== initialTicker;

    return (
        <div ref={searchRef} className="relative w-full max-w-lg">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder="Search for a stock..."
                    className="w-full bg-card border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    aria-autocomplete="list"
                    aria-expanded={showResults}
                />
                <button
                    type="submit"
                    className="bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                    aria-label="Search"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </button>
            </form>
            {showResults && (
                <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {isLoading && <div className="p-4 text-text-secondary">Searching...</div>}
                    {searchResults && searchResults.length > 0 && (
                        <ul>
                            {searchResults.map((result) => (
                                <li
                                    key={result.symbol}
                                    className="px-4 py-3 hover:bg-background cursor-pointer"
                                    onClick={() => handleSelectTicker(result)}
                                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur on click
                                >
                                    <div className="font-bold text-text-primary">{result.symbol}</div>
                                    <div className="text-sm text-text-secondary truncate">{result.description}</div>

                                </li>
                            ))}
                        </ul>
                    )}
                    {searchResults && searchResults.length === 0 && !isLoading && (
                         <div className="p-4 text-text-secondary">No results found for "{debouncedSearchTerm}".</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;