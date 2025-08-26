import type { Filing, NewsArticle, StockData, SearchResult, DetailedFinancials, FinancialReportRow } from '../types';

const API_KEY = 'd2hfijpr01qon4ec0eu0d2hfijpr01qon4ec0eug';
const BASE_URL = 'https://finnhub.io/api/v1';

async function apiFetch<T>(endpoint: string): Promise<T | null> {
    try {
        // Robustly append the API token
        const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Finnhub API error: ${response.status} ${response.statusText}`, errorText);
            return null;
        }
        return await response.json() as T;
    } catch (error) {
        console.error("Error fetching from Finnhub API:", error);
        return null;
    }
}

// --- WebSocket Manager for Live Data ---

type PriceUpdateCallback = (price: number) => void;

class WebSocketManager {
    private socket: WebSocket | null = null;
    private subscriptions: Map<string, PriceUpdateCallback> = new Map();
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;

    constructor() {
        this.connect();
    }

    private connect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

        this.socket = new WebSocket(`wss://ws.finnhub.io?token=${API_KEY}`);

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            // Resubscribe to all symbols on successful connection
            this.subscriptions.forEach((_, symbol) => {
                this.socket?.send(JSON.stringify({ type: 'subscribe', symbol }));
            });
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'trade' && message.data) {
                message.data.forEach((trade: { s: string; p: number; t: number }) => {
                    if (this.subscriptions.has(trade.s)) {
                        this.subscriptions.get(trade.s)?.(trade.p);
                    }
                });
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    console.log(`WebSocket reconnecting... attempt ${this.reconnectAttempts}`);
                    this.connect();
                }, 1000 * this.reconnectAttempts); // Exponential backoff
            } else {
                console.error('WebSocket max reconnect attempts reached.');
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.socket?.close();
        };
    }

    public subscribe(symbol: string, callback: PriceUpdateCallback) {
        if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'subscribe', symbol }));
        }
        this.subscriptions.set(symbol, callback);
    }

    public unsubscribe(symbol: string) {
        if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'unsubscribe', symbol }));
        }
        this.subscriptions.delete(symbol);
    }
}

export const webSocketManager = new WebSocketManager();


// --- REST API Functions ---

interface FinnhubQuote { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; }
interface FinnhubProfile { country: string; currency: string; exchange: string; ipo: string; marketCapitalization: number; name: string; phone: string; shareOutstanding: number; ticker: string; weburl: string; logo: string; finnhubIndustry: string; }
interface FinnhubFiling { accessNumber: string; symbol: string; cik: string; form: string; filedDate: string; acceptedDate: string; reportUrl: string; filingUrl: string; }
interface FinnhubNews { category: string; datetime: number; headline: string; id: number; image: string; related: string; source: string; summary: string; url: string; }
interface FinnhubFinancialsReport { endDate: string; year: number; report: { bs: any[]; cf: any[]; ic: any[]; } }
interface FinnhubFinancials { data: FinnhubFinancialsReport[]; symbol: string; }
interface FinnhubSearch { count: number; result: SearchResult[]; }
interface FinnhubMetrics { metric: Record<string, any>; series: { annual: Record<string, any[]> }; }


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
        previousClose: quote.pc,
        logo: profile.logo,
        exchange: profile.exchange,
        industry: profile.finnhubIndustry,
        website: profile.weburl,
    };
};

export const fetchFilings = async (ticker: string): Promise<Filing[]> => {
    const filings = await apiFetch<FinnhubFiling[]>(`/stock/filings?symbol=${ticker}`);
    if (!filings) return [];

    return filings.slice(0, 100).map(f => ({ // Fetch more for virtualization
        date: f.filedDate.split(' ')[0],
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
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const news = await apiFetch<FinnhubNews[]>(`/company-news?symbol=${ticker}&from=${from}&to=${to}`);
    if (!news) return [];

    return news.slice(0, 50).map(n => ({ // Fetch more for virtualization
        publishedDate: formatDate(n.datetime),
        source: n.source,
        headline: n.headline,
        summary: n.summary,
    }));
};

const STATEMENT_CONFIG = {
    incomeStatement: [
        { name: 'Revenue', concepts: ['us-gaap_Revenues', 'us-gaap_SalesRevenueNet', 'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax'], report: 'ic' },
        { name: 'Cost of Revenue', concepts: ['us-gaap_CostOfRevenue', 'us-gaap_CostOfGoodsAndServicesSold'], report: 'ic' },
        { name: 'Gross Profit', concepts: ['us-gaap_GrossProfit'], report: 'ic' },
        { name: 'Operating Income', concepts: ['us-gaap_OperatingIncomeLoss'], report: 'ic' },
        { name: 'Net Income', concepts: ['us-gaap_NetIncomeLoss'], report: 'ic' },
        { name: 'Basic EPS', concepts: ['us-gaap_EarningsPerShareBasic'], report: 'ic' },
    ],
    balanceSheet: [
        { name: 'Total Assets', concepts: ['us-gaap_Assets'], report: 'bs' },
        { name: 'Total Liabilities', concepts: ['us-gaap_Liabilities'], report: 'bs' },
        { name: 'Total Equity', concepts: ['us-gaap_StockholdersEquity', 'us-gaap_LiabilitiesAndStockholdersEquity'], report: 'bs' },
    ],
    cashFlowStatement: [
        { name: 'Operating Cash Flow', concepts: ['us-gaap_NetCashProvidedByUsedInOperatingActivities'], report: 'cf' },
        { name: 'Investing Cash Flow', concepts: ['us-gaap_NetCashProvidedByUsedInInvestingActivities'], report: 'cf' },
        { name: 'Financing Cash Flow', concepts: ['us-gaap_NetCashProvidedByUsedInFinancingActivities'], report: 'cf' },
    ],
};

const METRIC_CONFIG = {
    ratios: [
        { name: 'Current Ratio', key: 'currentRatio' },
        { name: 'Debt/Equity', key: 'debtToEquity' },
        { name: 'Return on Equity (ROE)', key: 'roe' },
        { name: 'Return on Assets (ROA)', key: 'roa' },
        { name: 'Net Profit Margin', key: 'netProfitMargin' },
    ],
    multiples: [
        { name: 'Price/Earnings (P/E)', key: 'pe' },
        { name: 'Price/Sales (P/S)', key: 'ps' },
        { name: 'Price/Book (P/B)', key: 'pb' },
        { name: 'EV/Sales', key: 'evToSales' },
        { name: 'EV/EBITDA', key: 'evToEbitda' },
    ],
};

export const fetchDetailedFinancialsAndMetrics = async (ticker: string): Promise<DetailedFinancials> => {
    const [financials, metrics] = await Promise.all([
        apiFetch<FinnhubFinancials>(`/stock/financials-reported?symbol=${ticker}&freq=annual`),
        apiFetch<FinnhubMetrics>(`/stock/metric?symbol=${ticker}&metric=all`)
    ]);

    const result: DetailedFinancials = {
        years: [],
        incomeStatement: [],
        balanceSheet: [],
        cashFlowStatement: [],
        ratios: [],
        multiples: [],
    };

    if (!financials || !financials.data || financials.data.length === 0) {
        return result;
    }
    
    const reports = financials.data.slice(0, 10).reverse();
    const years = reports.map(r => r.year.toString());
    result.years = years;

    const processSection = (section: keyof typeof STATEMENT_CONFIG): FinancialReportRow[] => {
        return STATEMENT_CONFIG[section].map(metric => {
            const row: FinancialReportRow = { metric: metric.name, values: {} };
            reports.forEach(reportData => {
                const reportSection = reportData.report[metric.report as keyof typeof reportData.report];
                let metricData = null;
                for (const concept of metric.concepts) {
                    metricData = reportSection?.find(item => item.concept === concept);
                    if (metricData) break;
                }
                 row.values[reportData.year] = metricData?.value ?? '--';
            });
            return row;
        });
    };

    result.incomeStatement = processSection('incomeStatement');
    result.balanceSheet = processSection('balanceSheet');
    result.cashFlowStatement = processSection('cashFlowStatement');

    if (metrics && metrics.series && metrics.series.annual) {
        const processMetrics = (section: keyof typeof METRIC_CONFIG): FinancialReportRow[] => {
            return METRIC_CONFIG[section].map(metric => {
                const row: FinancialReportRow = { metric: metric.name, values: {} };
                const metricSeries = metrics.series.annual[metric.key];
                if (metricSeries) {
                    metricSeries.forEach(dataPoint => {
                        if(years.includes(dataPoint.period.substring(0,4))) {
                            row.values[dataPoint.period.substring(0,4)] = dataPoint.v;
                        }
                    });
                }
                years.forEach(year => {
                    if(!(year in row.values)) {
                        row.values[year] = '--';
                    }
                });
                return row;
            });
        };
        result.ratios = processMetrics('ratios');
        result.multiples = processMetrics('multiples');
    }

    return result;
};