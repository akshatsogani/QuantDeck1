import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BacktestConfig, Backtest, BacktestResults } from "@/types/trading";

export function useBacktests() {
  return useQuery<Backtest[]>({
    queryKey: ["/api/backtests"],
  });
}

export function useBacktest(id: string) {
  return useQuery<Backtest>({
    queryKey: ["/api/backtests", id],
    enabled: !!id,
  });
}

export function useCreateBacktest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: BacktestConfig) => {
      const response = await apiRequest("POST", "/api/backtests", config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtests"] });
    },
  });
}

export function useRunBacktest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (backtestId: string) => {
      const response = await apiRequest("POST", `/api/backtests/${backtestId}/run`);
      return response.json();
    },
    onSuccess: (_, backtestId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/backtests", backtestId] });
    },
  });
}
