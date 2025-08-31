import type { EarningsTranscript, PerformanceComparison, PerformanceData } from '../types';

// Use a dedicated environment variable for the Alpha Vantage API key.
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '8AWR3MD4RCVYWT1L';
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
 * Fetches the latest earnings call transcript for a given stock ticker from Alpha Vantage.
 * Note: Alpha Vantage's free tier has limitations, and full transcript data is often a premium feature.
 * This function is structured to parse a detailed response should one be available.
 *
 * @param ticker The stock ticker symbol.
 * @returns A promise that resolves to the latest earnings transcript or null if not found.
 */
export const fetchLatestTranscript = async (ticker: string): Promise<EarningsTranscript | null> => {
    if (!API_KEY) {
        throw new Error('Alpha Vantage API key is not configured.');
    }

    // Alpha Vantage's public API for earnings transcripts is not well-documented or consistently available.
    // The `EARNINGS` endpoint provides EPS data, which we will use.
    // We will use a mock transcript text to demonstrate the UI feature, as full text is not reliably available on free tiers.
    
    try {
        const url = `${BASE_URL}?function=EARNINGS&symbol=${ticker}&apikey=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.Note || data['Error Message']) {
             console.warn('Alpha Vantage API call limit reached or error:', data.Note || data['Error Message']);
             return null; // Return null to indicate no data, not a hard error.
        }

        const quarterlyEarnings = data?.quarterlyEarnings;

        if (!quarterlyEarnings || quarterlyEarnings.length === 0) {
            return null;
        }

        // Find the most recent quarterly earnings report
        const latestEarning = quarterlyEarnings.reduce((latest: any, current: any) => 
            new Date(latest.fiscalDateEnding) > new Date(current.fiscalDateEnding) ? latest : current
        );
        
        const [_, quarterStr] = latestEarning.fiscalDateEnding.match(/-(\d{2})-/) || [];
        const quarter = quarterStr ? Math.ceil(parseInt(quarterStr, 10) / 3) : 0;
        
        // MOCK TRANSCRIPT DATA - as full text is a premium feature.
        const mockTranscript = `
Operator: Good day, and welcome to the ${data.symbol} Q${quarter} ${new Date(latestEarning.fiscalDateEnding).getFullYear()} Earnings Conference Call. Today's conference is being recorded. At this time, I would like to turn the conference over to the Head of Investor Relations. Please go ahead.

Head of IR: Thank you. Good afternoon, and welcome to ${data.symbol}'s earnings conference call for the quarter ending ${latestEarning.fiscalDateEnding}. With me today are our CEO and CFO.

Our CEO will begin with a review of the quarter's performance, and our CFO will cover the financial results in more detail before we open the call for questions.

...

[This is a demonstrative transcript. Full text access from financial data providers is typically a premium feature. This view showcases how a full transcript would be displayed in the UI.]

...

CFO: Thank you. Now, let's discuss our financial performance for the quarter. We reported a revenue of [Revenue Figure] and a reported EPS of ${latestEarning.reportedEPS}, which aligns with our projections. Our net income was [Net Income Figure], reflecting strong operational efficiency. We remain optimistic about our growth trajectory and are committed to delivering shareholder value.

We will now open the call for your questions.

Operator: Thank you. [Operator Instructions] Our first question comes from the line of [Analyst Name] with [Firm Name]. Please proceed with your question.

Analyst: Thank you for taking my question. Could you provide more color on the key drivers for the revenue growth this quarter?

CEO: Certainly. Our growth was primarily driven by strong performance in our [Product/Service] segment, which saw a significant increase in customer adoption. We also expanded our market share in key international regions. We believe these trends are sustainable and will continue to fuel our growth in the coming quarters.

...

[End of demonstrative transcript.]
        `.trim();


        return {
            symbol: data.symbol,
            quarter: quarter,
            year: new Date(latestEarning.fiscalDateEnding).getFullYear(),
            date: latestEarning.fiscalDateEnding,
            eps: parseFloat(latestEarning.reportedEPS),
            transcript: mockTranscript,
        };

    } catch (error) {
        console.error("Error fetching or parsing Alpha Vantage data:", error);
        throw error; // Re-throw to be caught by React Query
    }
};
