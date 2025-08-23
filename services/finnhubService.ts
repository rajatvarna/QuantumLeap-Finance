import type { Filing, NewsArticle, StockData, AnnualReport, SearchResult } from '../types';

const API_KEY = 'd2hfijpr01qon4ec0eu0d2hfijpr01qon4ec0eug';
const BASE_URL = 'https://finnhub.io/api/v1';

async function apiFetch<T>(endpoint: string): Promise<T | null> {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}&token=${API_KEY}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Finnhub API error: ${response.status} ${response.statusText}`, errorText);
            // Propagate a specific error message if possible
            throw new Error(`Finnhub API error for ${endpoint}: ${response.status} ${response.statusText}`);
        }
        return await response.json() as T;
    } catch (error) {
        console.error("Error fetching from Finnhub API:", error);
        throw error; // Re-throw the error so React Query can handle it
    }
}

interface FinnhubQuote {
    c: number; // current price
    d: number; // change
    dp: number; // percent change
    h: number; // high
    l: number; // low
    o: number; // open
    pc: number; // previous close
}

interface FinnhubProfile {
    country: string;
    currency: string;
    exchange: string;
    ipo: string;
    marketCapitalization: number;
    name: string;
    phone: string;
    shareOutstanding: number;
    ticker: string;
    weburl: string;
    logo: string;
    finnhubIndustry: string;
}

interface FinnhubFiling {
    accessNumber: string;
    symbol: string;
    cik: string;
    form: string;
    filedDate: string;
    acceptedDate: string;
    reportUrl: string;
    filingUrl: string;
}

interface FinnhubNews {
    category: string;
    datetime: number; // Unix timestamp
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}

interface FinnhubFinancialsReport {
    endDate: string;
    year: number;
    report: {
        bs: { concept: string; label: string; unit: string; value: number }[];
        cf: { concept: string; label: string; unit: string; value: number }[];
        ic: { concept: string; label: string; unit: string; value: number }[];
    }
}
interface FinnhubFinancials {
    data: FinnhubFinancialsReport[];
    symbol: string;
}

interface FinnhubSearch {
    count: number;
    result: SearchResult[];
}

export const searchSymbols = async (query: string): Promise<SearchResult[]> => {
    if (!query) return [];
    const response = await apiFetch<FinnhubSearch>(`/search?q=${query}`);
    return response?.result || [];
};


export const fetchStockData = async (ticker: string): Promise<StockData> => {
    const [quote, profile] = await Promise.all([
        apiFetch<FinnhubQuote>(`/quote?symbol=${ticker}`),
        apiFetch<FinnhubProfile>(`/stock/profile2?symbol=${ticker}`)
    ]);

    if (!quote || !profile || !profile.ticker) {
        throw new Error(`Invalid data for ticker: ${ticker}`);
    }

    return {
        ticker: profile.ticker,
        companyName: profile.name,
        marketCap: profile.marketCapitalization,
        price: quote.c,
        change: quote.d,
        changePercent: quote.dp,
    };
};

export const fetchFilings = async (ticker: string): Promise<Filing[]> => {
    const filings = await apiFetch<FinnhubFiling[]>(`/stock/filings?symbol=${ticker}`);
    if (!filings) return [];

    return filings.slice(0, 15).map(f => ({
        date: f.filedDate.split(' ')[0], // Keep only the date part
        type: f.form,
        link: f.filingUrl,
        headline: `Form ${f.form} filed on ${f.filedDate}`,
    }));
};

const formatDate = (unixTimestamp: number): string => {
    const date = new Date(unixTimestamp * 1000);
    return date.toISOString().split('T')[0];
};

export const fetchNews = async (ticker: string): Promise<NewsArticle[]> => {
    // Get today's and 30 days ago dates in YYYY-MM-DD format
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const news = await apiFetch<FinnhubNews[]>(`/company-news?symbol=${ticker}&from=${from}&to=${to}`);
    if (!news) return [];

    return news.slice(0, 10).map(n => ({
        publishedDate: formatDate(n.datetime),
        source: n.source,
        headline: n.headline,
        summary: n.summary,
    }));
};

const METRIC_CONFIG = [
    { name: 'Revenue', concept: 'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax', report: 'ic' },
    { name: 'Net Income', concept: 'us-gaap_NetIncomeLoss', report: 'ic' },
    { name: 'Basic EPS', concept: 'us-gaap_EarningsPerShareBasic', report: 'ic' },
    { name: 'Total Assets', concept: 'us-gaap_Assets', report: 'bs' },
    { name: 'Total Liabilities', concept: 'us-gaap_Liabilities', report: 'bs' },
    { name: 'Operating Cash Flow', concept: 'us-gaap_NetCashProvidedByUsedInOperatingActivities', report: 'cf' },
];

export const fetchFinancials = async (ticker: string): Promise<{ reports: AnnualReport[], years: string[] }> => {
    const financials = await apiFetch<FinnhubFinancials>(`/stock/financials-reported?symbol=${ticker}&freq=annual`);

    if (!financials || !financials.data || financials.data.length === 0) {
        return { reports: [], years: [] };
    }

    const reports = financials.data.slice(0, 10).reverse(); // Oldest to newest, max 10
    const years = reports.map(r => r.year.toString());
    
    const processedData: { [metric: string]: { [year: string]: number } } = {};

    METRIC_CONFIG.forEach(metric => {
        processedData[metric.name] = {};
        reports.forEach(reportData => {
            const reportSection = reportData.report[metric.report as keyof typeof reportData.report];
            const metricData = reportSection.find(item => item.concept === metric.concept);
            processedData[metric.name][reportData.year] = metricData?.value ?? 0;
        });
    });
    
    const annualReports: AnnualReport[] = METRIC_CONFIG.map(metric => ({
        metric: metric.name,
        values: processedData[metric.name]
    }));

    return { reports: annualReports, years };
};