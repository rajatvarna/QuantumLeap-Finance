
import { GoogleGenAI, Type } from "@google/genai";
import type { StockPricePoint, Filing, NewsArticle, StockData } from '../types';

// IMPORTANT: This check is to prevent crashing in environments where process.env is not defined.
const apiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY
  ? process.env.API_KEY
  : "YOUR_API_KEY";

if (apiKey === "YOUR_API_KEY") {
    console.warn("API_KEY is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey });

const stockDataSchema = {
    type: Type.OBJECT,
    properties: {
        ticker: { type: Type.STRING },
        companyName: { type: Type.STRING },
        marketCap: { type: Type.STRING, description: "e.g., '$2.1T'" },
        peRatio: { type: Type.NUMBER },
        price: { type: Type.NUMBER },
        change: { type: Type.NUMBER },
        changePercent: { type: Type.NUMBER },
    }
};

const priceHistorySchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            price: { type: Type.NUMBER },
        },
    },
};

const filingsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            type: { type: Type.STRING, description: "e.g., '10-K', '10-Q', '8-K'" },
            link: { type: Type.STRING, description: "A valid URL to the SEC filing." },
            headline: { type: Type.STRING },
        },
    },
};

const newsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            publishedDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
            source: { type: Type.STRING, description: "e.g., 'Reuters', 'Bloomberg'" },
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
        },
    },
};

const generateJson = async <T,>(prompt: string, schema: object): Promise<T | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;
    } catch (error) {
        console.error("Error fetching data from Gemini API:", error);
        return null;
    }
};

export const fetchStockData = (ticker: string) => 
    generateJson<StockData>(`Generate mock stock data for ${ticker}.`, stockDataSchema);

export const fetchPriceHistory = (ticker: string) => 
    generateJson<StockPricePoint[]>(`Generate a mock daily price history for the last 90 days for ${ticker}. Dates should be in ascending order.`, priceHistorySchema);

export const fetchFilings = (ticker: string) => 
    generateJson<Filing[]>(`Generate 15 mock SEC filings for ${ticker}.`, filingsSchema);

export const fetchNews = (ticker: string) => 
    generateJson<NewsArticle[]>(`Generate 10 recent news articles for ${ticker}.`, newsSchema);
