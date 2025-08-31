import type { EarningsTranscript, PerformanceComparison, PerformanceData } from '../types';

// Use a dedicated environment variable for the Alpha Vantage API key.
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'XIAGUPO07P3BSVD5';
const BASE_URL = 'https://www.alphavantage.co/query';

interface AlphaVantageTimeSeries {
    [date: string]: {
        '5. adjusted close': string;
    };
}

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


const fetchDailyAdjusted = async (ticker: string): Promise<AlphaVantageTimeSeries | null> => {
    try {
        const url = `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${API_KEY}`;
        const data = await alphaVantageApiFetch<{ 'Time Series (Daily)': AlphaVantageTimeSeries }>(url, 'TIME_SERIES_DAILY_ADJUSTED', ticker);
        
        // The API can return an empty object {} for an invalid symbol, so we check for the actual data key.
        return data['Time Series (Daily)'] || null;
    } catch (error) {
        // The error is already an AlphaVantageApiError, so we just log its message.
        console.error(`Error fetching daily adjusted data for ${ticker}:`, (error as Error).message);
        return null; // Return null on any API or network error
    }
};

const calculatePerformance = (timeSeries: AlphaVantageTimeSeries | null): PerformanceData => {
    if (!timeSeries) return {};

    const sortedDates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (sortedDates.length < 2) return {};

    const findPriceOnOrBefore = (targetDate: Date): number | null => {
        const targetDateString = targetDate.toISOString().split('T')[0];
        const date = sortedDates.find(d => d <= targetDateString);
        return date ? parseFloat(timeSeries[date]['5. adjusted close']) : null;
    };

    const latestPrice = parseFloat(timeSeries[sortedDates[0]]['5. adjusted close']);
    if (isNaN(latestPrice)) return {};
    
    const results: PerformanceData = {};
    const today = new Date(sortedDates[0]);

    const calcReturn = (pastDate: Date): number | null => {
        const pastPrice = findPriceOnOrBefore(pastDate);
        if (pastPrice && latestPrice && pastPrice !== 0) {
            return ((latestPrice - pastPrice) / pastPrice) * 100;
        }
        return null;
    };

    let pastDate: Date;

    pastDate = new Date(today); pastDate.setDate(today.getDate() - 7);
    results['1W'] = calcReturn(pastDate);

    pastDate = new Date(today); pastDate.setMonth(today.getMonth() - 1);
    results['1M'] = calcReturn(pastDate);
    
    pastDate = new Date(today); pastDate.setMonth(today.getMonth() - 3);
    results['3M'] = calcReturn(pastDate);

    pastDate = new Date(today); pastDate.setMonth(today.getMonth() - 6);
    results['6M'] = calcReturn(pastDate);

    const startOfYear = new Date(today.getFullYear() - 1, 11, 31);
    results['YTD'] = calcReturn(startOfYear);

    pastDate = new Date(today); pastDate.setFullYear(today.getFullYear() - 1);
    results['1Y'] = calcReturn(pastDate);

    pastDate = new Date(today); pastDate.setFullYear(today.getFullYear() - 3);
    results['3Y'] = calcReturn(pastDate);

    pastDate = new Date(today); pastDate.setFullYear(today.getFullYear() - 5);
    results['5Y'] = calcReturn(pastDate);

    return results;
};

export const fetchPerformanceComparison = async (ticker: string): Promise<PerformanceComparison> => {
    try {
        const [tickerData, spyData, qqqData] = await Promise.all([
            fetchDailyAdjusted(ticker),
            fetchDailyAdjusted('SPY'),
            fetchDailyAdjusted('QQQ')
        ]);
        
        const result: PerformanceComparison = {
            [ticker]: calculatePerformance(tickerData),
            SPY: calculatePerformance(spyData),
            QQQ: calculatePerformance(qqqData),
        };

        return result;
    } catch (error) {
        console.error("Error fetching performance comparison data from Alpha Vantage:", error);
        throw error;
    }
};
