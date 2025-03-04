import { CategoryStats, TimeRange } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

async function fetchCategoryStats(timeRange: TimeRange): Promise<CategoryStats[]> {
    const response = await fetch(`/api/statistics/categories?range=${timeRange}`);
    if (!response.ok) {
        throw new Error('Failed to fetch category statistics');
    }
    const data = await response.json();
    return data;
}

export function useCategoryStats(timeRange: TimeRange) {
    return useQuery<CategoryStats[], Error>({
        queryKey: ['categoryStats', timeRange],
        queryFn: () => fetchCategoryStats(timeRange),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
} 