import type { Filing, NewsArticle, StockData } from '../types';

const API_KEY = 'd2hfijpr01qon4ec0eu0d2hfijpr01qon4ec0eug';
const BASE_URL = 'https://finnhub.io/api/v1';

async function apiFetch<T>(endpoint: string): Promise<T | null> {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}&token=${API_KEY}`);
        if (!response.ok) {
            console.error(`Finnhub API error: ${response.status} ${response.statusText}`);
            return null;
        }
        return await response.json() as T;
    } catch (error) {
        console.error("Error fetching from Finnhub API:", error);
        return null;
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


export const fetchStockData = async (ticker: string): Promise<StockData | null> => {
    const [quote, profile] = await Promise.all([
        apiFetch<FinnhubQuote>(`/quote?symbol=${ticker}`),
        apiFetch<FinnhubProfile>(`/stock/profile2?symbol=${ticker}`)
    ]);

    if (!quote || !profile || !profile.ticker) {
        return null;
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

export const fetchFilings = async (ticker: string): Promise<Filing[] | null> => {
    const filings = await apiFetch<FinnhubFiling[]>(`/stock/filings?symbol=${ticker}`);
    if (!filings) return null;

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

export const fetchNews = async (ticker: string): Promise<NewsArticle[] | null> => {
    // Get today's and 30 days ago dates in YYYY-MM-DD format
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const news = await apiFetch<FinnhubNews[]>(`/company-news?symbol=${ticker}&from=${from}&to=${to}`);
    if (!news) return null;

    return news.slice(0, 10).map(n => ({
        publishedDate: formatDate(n.datetime),
        source: n.source,
        headline: n.headline,
        summary: n.summary,
    }));
};
