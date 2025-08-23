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

export interface StockData {
    ticker: string;
    companyName: string;
    marketCap: number;
    peRatio?: number;
    price: number;
    change: number;
    changePercent: number;
}

export interface AnnualReport {
    metric: string;
    values: { [year: string]: number | string };
}

export interface SearchResult {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
}