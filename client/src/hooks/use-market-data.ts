import { useQuery } from "@tanstack/react-query";
import { MarketDataResponse } from "@/types/trading";

export function useMarketData(ticker: string, startDate: string, endDate: string) {
  return useQuery<MarketDataResponse>({
    queryKey: ["/api/market-data", ticker],
    queryFn: async () => {
      const response = await fetch(`/api/market-data/${ticker}?start_date=${startDate}&end_date=${endDate}`);
      if (!response.ok) {
        throw new Error("Failed to fetch market data");
      }
      return response.json();
    },
    enabled: !!ticker && !!startDate && !!endDate,
  });
}

export function useTickerValidation(ticker: string) {
  return useQuery<{ valid: boolean; info?: any }>({
    queryKey: ["/api/validate-ticker", ticker],
    enabled: !!ticker && ticker.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
