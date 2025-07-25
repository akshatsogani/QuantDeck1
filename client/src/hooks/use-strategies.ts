import { useQuery } from "@tanstack/react-query";
import { StrategyConfig } from "@/types/trading";

export function useStrategies() {
  return useQuery<StrategyConfig[]>({
    queryKey: ["/api/strategies"],
  });
}

export function useStrategy(id: string) {
  return useQuery<StrategyConfig>({
    queryKey: ["/api/strategies", id],
    enabled: !!id,
  });
}
