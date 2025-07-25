import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: "positive" | "negative" | "neutral";
  className?: string;
}

export function MetricCard({ label, value, trend = "neutral", className }: MetricCardProps) {
  const trendColor = {
    positive: "text-success",
    negative: "text-danger", 
    neutral: ""
  };

  return (
    <Card className={cn("metric-card", className)}>
      <CardContent className="p-4 text-center">
        <div className={cn("metric-value", trendColor[trend])}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </div>
        <div className="metric-label">{label}</div>
      </CardContent>
    </Card>
  );
}
