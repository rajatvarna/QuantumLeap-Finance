import type { EarningsTranscript, PerformanceComparison, PerformanceData, InsiderTransaction } from '../types';

// Use a dedicated environment variable for the Alpha Vantage API key.
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'XIAGUPO07P3BSVD5';
const BASE_URL = 'https://www.alphavantage.co/query';

interface AlphaVantageTimeSeries {
    [date: string]: {
        '5. adjusted close': string;
    };
}

const fetchDailyAdjusted = async (ticker: string): Promise<AlphaVantageTimeSeries | null> => {
    try {
        const url = `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.Note || data['Error Message']) {
            console.warn(`Alpha Vantage API call for ${ticker} failed:`, data.Note || data['Error Message']);
            // This could be a rate limit, so we return null instead of throwing an error to not fail the entire widget.
            return null;
        }
        return data['Time Series (Daily)'];
    } catch (error) {
        console.error(`Error fetching daily adjusted data for ${ticker}:`, error);
        return null; // Return null on network errors as well
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

/**
 * Fetches real earnings call transcripts from Alpha Vantage.
 */
export const fetchLatestTranscript = async (ticker: string): Promise<EarningsTranscript | null> => {
    if (!API_KEY) throw new Error('Alpha Vantage API key is not configured.');
    
    try {
        // Step 1: Fetch earnings data to find the latest quarter.
        const earningsUrl = `${BASE_URL}?function=EARNINGS&symbol=${ticker}&apikey=${API_KEY}`;
        const earningsResponse = await fetch(earningsUrl);
        const earningsData = await earningsResponse.json();

        if (earningsData.Note || !earningsData.quarterlyEarnings || earningsData.quarterlyEarnings.length === 0) {
            console.warn(`No quarterly earnings data for ${ticker}.`);
            return null;
        }
        
        const latestEarning = earningsData.quarterlyEarnings[0];
        const reportDate = latestEarning.reportedDate;
        const reportedEPS = parseFloat(latestEarning.reportedEPS);
        const fiscalDateEnding = latestEarning.fiscalDateEnding; // e.g., "2024-03-31"

        // Derive quarter and year from fiscalDateEnding
        const date = new Date(fiscalDateEnding);
        const year = date.getUTCFullYear();
        const quarter = Math.floor(date.getUTCMonth() / 3) + 1;

        // Step 2: Fetch the full transcript using the derived quarter and year.
        const transcriptUrl = `${BASE_URL}?function=EARNINGS_CALL_TRANSCRIPT&symbol=${ticker}&quarter=${quarter}&fiscalYear=${year}&apikey=${API_KEY}`;
        const transcriptResponse = await fetch(transcriptUrl);
        const transcriptData = await transcriptResponse.json();

        if (transcriptData.Note || transcriptData['Error Message'] || !transcriptData.content) {
            console.warn(`Could not fetch full transcript for ${ticker} Q${quarter} ${year}`);
            return null;
        }
        
        return {
            symbol: ticker,
            quarter: quarter,
            year: year,
            date: reportDate,
            eps: reportedEPS,
            transcript: transcriptData.content,
        };
    } catch (error) {
        console.error("Error fetching or parsing Alpha Vantage transcript data:", error);
        throw error;
    }
};

/**
 * Fetches insider trading transactions from Alpha Vantage.
 */
export const fetchInsiderTransactions = async (ticker: string): Promise<InsiderTransaction[]> => {
    if (!API_KEY) throw new Error('Alpha Vantage API key is not configured.');

    try {
        // Explicitly request JSON data format to ensure consistency.
        const url = `${BASE_URL}?function=INSIDER_TRANSACTIONS&symbol=${ticker}&datatype=json&apikey=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();

        // Handle API rate limiting or error messages gracefully.
        if (data.Note || data['Error Message']) {
            console.warn(`Insider trading data fetch failed for ${ticker}:`, data.Note || data['Error Message']);
            return [];
        }

        // Validate the structure of the response.
        if (!data.data || !Array.isArray(data.data)) {
            console.warn(`Unexpected response format for insider trading data for ${ticker}:`, data);
            return [];
        }

        // Map and parse the transaction data, ensuring data integrity.
        return data.data.slice(0, 100).map((t: any) => {
            const change = parseInt(t.shares, 10);
            const transactionPrice = parseFloat(t.price);
            const value = parseFloat(t.total);

            return {
                name: t.insider || 'N/A',
                share: 0, // This specific endpoint does not provide shares held after transaction.
                change: !isNaN(change) ? change : 0,
                transactionDate: t.transactionDate || 'N/A',
                transactionPrice: !isNaN(transactionPrice) ? transactionPrice : 0,
                transactionCode: t.transactionCode || 'N/A',
                value: !isNaN(value) ? value : 0,
            };
        });

    } catch (error) {
        console.error(`Error fetching insider transactions for ${ticker}:`, error);
        throw error;
    }
};
