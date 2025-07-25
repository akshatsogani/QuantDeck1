import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface EquityChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
  className?: string;
}

export function EquityChart({ data, className }: EquityChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-sm font-medium text-card-foreground">Equity Curve</h3>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Portfolio Value"]}
              />
              
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--success))"
                strokeWidth={3}
                fill="hsl(var(--success))"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
