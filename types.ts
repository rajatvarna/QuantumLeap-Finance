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

export interface Shareholder {
    name: string;
    share: number;
    change: number;
    filingDate: string;
}