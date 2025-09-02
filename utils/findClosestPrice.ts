import type { HistoricalPriceData } from '../types';

export const findClosestPrice = (targetDate: Date, data: HistoricalPriceData[]): HistoricalPriceData | null => {
    if (!data || data.length === 0) return null;
    const targetTime = targetDate.getTime();
    
    // Use binary search for efficiency since data is sorted
    let low = 0;
    let high = data.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const midTime = new Date(data[mid].date).getTime();

        if (midTime < targetTime) {
            low = mid + 1;
        } else if (midTime > targetTime) {
            high = mid - 1;
        } else {
            return data[mid]; // Exact match found
        }
    }
    
    // After loop, low is the insertion point. Check neighbors for closest.
    const highCandidate = data[low];
    const lowCandidate = data[high];

    if (!highCandidate) return lowCandidate;
    if (!lowCandidate) return highCandidate;

    const highDiff = Math.abs(new Date(highCandidate.date).getTime() - targetTime);
    const lowDiff = Math.abs(new Date(lowCandidate.date).getTime() - targetTime);

    return highDiff < lowDiff ? highCandidate : lowCandidate;
};
