


// Fix: Add import for the PerformanceComparison type.
import type { PerformanceComparison } from '../types';

// Use a dedicated environment variable for the Alpha Vantage API key.
// Fix: Rename API_KEY to prevent a redeclaration error with other service files.
const ALPHAVANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'XIAGUPO07P3BSVD5';
const BASE_URL = 'https://www.alphavantage.co/query';

class AlphaVantageApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AlphaVantageApiError';
    }
}

/**
 * A robust fetch wrapper for the Alpha Vantage API.
 * It verifies the response is JSON before parsing, handles API-level errors,
 * and provides better error diagnostics.
 */
async function alphaVantageApiFetch<T>(url: string, apiFunction: string, ticker: string): Promise<T> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new AlphaVantageApiError(`API HTTP error: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get("content-type");
        // Handle non-JSON responses, which can happen with API key errors or rate limiting text responses
        if (!contentType || !contentType.includes("application/json")) {
             const responseText = await response.text();
             console.error(`Alpha Vantage API (${apiFunction} for ${ticker}) did not return JSON. Response snippet:`, responseText.substring(0, 500));
             
             if (responseText.includes("the parameter apikey is invalid or missing")) {
                throw new AlphaVantageApiError('Invalid or missing Alpha Vantage API key.');
             }
             if (responseText.includes("Our standard API call frequency is")) {
                throw new AlphaVantageApiError('API rate limit reached. Please wait and try again.');
             }
             throw new AlphaVantageApiError(`Invalid response format from API. Expected JSON, got ${contentType || 'none'}.`);
        }
        
        const data = await response.json();

        // Handle JSON responses that contain API-level errors or notes (e.g., rate limit)
        if (data.Note) {
             console.warn(`Alpha Vantage API Note for ${ticker}:`, data.Note);
             throw new AlphaVantageApiError('API rate limit reached. Please wait and try again.');
        }
        if (data['Error Message']) {
             console.warn(`Alpha Vantage API Error for ${ticker}:`, data['Error Message']);
             throw new AlphaVantageApiError(data['Error Message']);
        }
        
        return data as T;

    } catch (error) {
        if (error instanceof AlphaVantageApiError) {
            throw error; // Re-throw custom errors to be handled by the calling function.
        }
        console.error(`Network or unexpected error in alphaVantageApiFetch for ${ticker}:`, error);
        throw new AlphaVantageApiError(`A network error occurred while fetching ${apiFunction} data.`);
    }
}

// Fix: Add and export fetchPerformanceComparison to resolve module and import errors.
// This is a mock implementation because a real one is complex and beyond the scope of this fix.
export const fetchPerformanceComparison = async (ticker: string): Promise<PerformanceComparison> => {
    console.warn(`[MOCK] Performance data for ${ticker} is not from a live API.`);
    
    const generatePerf = (multiplier: number) => ({
        '1W': 1.1 * multiplier, '1M': 3.2 * multiplier, '3M': 8.5 * multiplier, '6M': 15.1 * multiplier,
        'YTD': 18.2 * multiplier, '1Y': 30.4 * multiplier, '3Y': 75.3 * multiplier, '5Y': 120.8 * multiplier,
    });

    return {
        [ticker]: generatePerf(1.2), // Mock the ticker to slightly outperform SPY
        'SPY': generatePerf(1),
        'QQQ': generatePerf(1.1),
    };
};
