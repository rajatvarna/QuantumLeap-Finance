export enum SubscriptionPlan {
    FREE = 'Free',
    PRO = 'Pro',
    ENTERPRISE = 'Enterprise',
}

export interface User {
    name: string;
    plan: SubscriptionPlan;
}

export interface Filing {
    date: string;
    type: string;
    link: string;
    headline: string;
}

export interface NewsArticle {
    publishedDate: string;
    source: string;
    headline: string;
    summary: string;
    url: string;
}

export interface SentimentAnalysisResult {
    overallSentiment: 'Positive' | 'Negative' | 'Neutral';
    sentimentScore: number;
    summary: string;
}

export interface StockData {
    ticker: string;
    companyName: string;
    marketCap: number;
    peRatio?: number;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    shareOutstanding?: number;
    logo?: string;
    exchange?: string;
    industry?: string;
    website?: string;
}

export interface SearchResult {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
}

// Types for the new FinancialsView component
export type FinancialReportData = {
    [year: string]: number | string;
};

export interface FinancialReportRow {
    metric: string;
    values: FinancialReportData;
    isSubheader?: boolean;
}

export interface DetailedFinancials {
    years: string[];
    incomeStatement: FinancialReportRow[];
    balanceSheet: FinancialReportRow[];
    cashFlowStatement: FinancialReportRow[];
    ratios: FinancialReportRow[];
    multiples: FinancialReportRow[];
}

export interface EarningsTranscript {
    symbol: string;
    quarter: number;
    year: number;
    date: string;
    eps: number;
    transcript: string;
}

export interface InsiderTransaction {
  name: string;
  share: number; // shares held after
  change: number; // shares transacted
  transactionDate: string;
  transactionPrice: number;
  transactionCode: string;
  value: number;
}
// Fix: Add Shareholder interface to define the structure for shareholder data.
export interface Shareholder {
    name: string;
    share: number;
    filingDate: string;
}

export interface AnalystRating {
    period: string;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
}

export interface HistoricalPriceData {
    date: string;
    close: number;
}

export interface PeerComparisonData {
    ticker: string;
    companyName: string;
    marketCap: number;
    peRatio?: number | null;
    ytdPerformance: number | null;
}