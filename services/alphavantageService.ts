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
        const url = `${BASE_URL}?function=EARNINGS_CALENDAR&symbol=${ticker}&horizon=3month&apikey=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        // The endpoint returns CSV data.
        const csvText = await response.text();
        if (!csvText || csvText.startsWith('{')) { // Error responses are JSON
            console.warn(`No earnings calendar data for ${ticker}.`);
            return null;
        }

        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return null;

        const latestEvent = lines[1].split(','); // Get the most recent event
        const reportDate = latestEvent[2];
        const reportedEPS = parseFloat(latestEvent[4]);
        const quarterMatch = latestEvent[6]?.match(/Q(\d)(\d{4})/);
        
        if (!quarterMatch) return null;

        const [, qtr, year] = quarterMatch;
        const quarter = parseInt(qtr);

        // Now, fetch the full transcript
        const transcriptUrl = `${BASE_URL}?function=TRANSCRIPT&symbol=${ticker}&quarter=Q${quarter}${year}&apikey=${API_KEY}`;
        const transcriptResponse = await fetch(transcriptUrl);
        const transcriptData = await transcriptResponse.json();

        if (transcriptData.Note || transcriptData['Error Message'] || !transcriptData.transcript) {
            console.warn(`Could not fetch full transcript for ${ticker} Q${quarter} ${year}`);
            return null;
        }
        
        const formattedTranscript = transcriptData.transcript.map(
            (entry: { participant: string; dialogue: string }) => `${entry.participant}:\n${entry.dialogue}`
        ).join('\n\n');

        return {
            symbol: ticker,
            quarter: quarter,
            year: parseInt(year),
            date: reportDate,
            eps: reportedEPS,
            transcript: formattedTranscript,
        };
    } catch (error) {
        console.error("Error fetching or parsing Alpha Vantage transcript data:", error);
        throw error;
    }
};


/**
 * A robust CSV line parser that handles quoted fields containing commas.
 * @param line - A single line from a CSV file.
 * @returns An array of strings representing the fields.
 */
const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i+1];

        if (char === '"' && inQuotes && nextChar === '"') { // Handle escaped quote
            current += '"';
            i++; // Skip next quote
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
};


/**
 * Fetches insider trading transactions from Alpha Vantage.
 */
export const fetchInsiderTransactions = async (ticker: string): Promise<InsiderTransaction[]> => {
    if (!API_KEY) throw new Error('Alpha Vantage API key is not configured.');

    try {
        const url = `${BASE_URL}?function=INSIDER_TRADING&symbol=${ticker}&apikey=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const text = await response.text();
        
        // Handle API errors which might not be JSON
        if (!text.trim().startsWith('symbol,name,share,change')) {
            try {
                const errorJson = JSON.parse(text);
                 if (errorJson.Note || errorJson['Error Message']) {
                    console.warn(`Insider trading data fetch failed for ${ticker}:`, errorJson.Note || errorJson['Error Message']);
                    return [];
                }
            } catch (e) {
                console.error(`Unexpected response for insider trading data for ${ticker}:`, text.substring(0, 200));
                return [];
            }
        }

        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());

        const data = lines.slice(1).map(line => {
            const values = parseCsvLine(line);
            if (values.length !== headers.length) {
                console.warn("Skipping malformed CSV line:", line);
                return null;
            }
            const entry: any = {};
            headers.forEach((header, i) => {
                const value = values[i] || '';
                entry[header] = value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
            });
            return entry;
        }).filter(Boolean) as any[];


        return data.slice(0, 100).map((t: any) => ({
            name: t.name,
            share: parseInt(t.share),
            change: parseInt(t.change),
            transactionDate: t.transactionDate,
            transactionPrice: parseFloat(t.transactionPrice),
            transactionCode: t.transactionCode,
            value: Math.abs(parseInt(t.change) * parseFloat(t.transactionPrice)),
        }));

    } catch (error) {
        console.error(`Error fetching insider transactions for ${ticker}:`, error);
        throw error;
    }
};