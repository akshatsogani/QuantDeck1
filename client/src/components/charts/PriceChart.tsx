import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { MarketData } from "@/types/trading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface PriceChartProps {
  data: MarketData[];
  signals?: {
    dates: string[];
    prices: number[];
    signals: number[];
  };
  indicators?: Record<string, number[]>;
  className?: string;
}

export function PriceChart({ data, signals, indicators, className }: PriceChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const baseData = {
        date: new Date(item.Date).toLocaleDateString(),
        price: item.Close,
        volume: item.Volume,
      };

      // Add indicators if provided
      if (indicators) {
        Object.entries(indicators).forEach(([key, values]) => {
          if (values[index] !== undefined) {
            baseData[key] = values[index];
          }
        });
      }

      // Add signals if provided
      if (signals && signals.dates[index]) {
        const signal = signals.signals[index];
        if (signal === 1) {
          baseData['buySignal'] = signals.prices[index];
        } else if (signal === -1) {
          baseData['sellSignal'] = signals.prices[index];
        }
      }

      return baseData;
    });
  }, [data, signals, indicators]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="card-title">
          <i className="fas fa-chart-line mr-2 text-primary"></i>
          Price Chart & Signals
        </h3>
        <div className="flex items-center space-x-2">
          <button className="btn-chart-type active" data-testid="button-chart-candlestick">
            Candlestick
          </button>
          <button className="btn-chart-type" data-testid="button-chart-line">
            Line
          </button>
          <button className="btn-chart-type" data-testid="button-chart-ohlc">
            OHLC
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="Price"
              />
              
              {/* Moving Average if available */}
              {indicators?.MA && (
                <Line 
                  type="monotone" 
                  dataKey="MA" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="MA(20)"
                />
              )}
              
              {/* Buy signals */}
              <Line 
                type="monotone" 
                dataKey="buySignal" 
                stroke="hsl(var(--success))" 
                strokeWidth={0}
                dot={{ fill: "hsl(var(--success))", strokeWidth: 2, r: 4 }}
                name="Buy Signal"
              />
              
              {/* Sell signals */}
              <Line 
                type="monotone" 
                dataKey="sellSignal" 
                stroke="hsl(var(--danger))" 
                strokeWidth={0}
                dot={{ fill: "hsl(var(--danger))", strokeWidth: 2, r: 4 }}
                name="Sell Signal"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-muted-foreground">Buy Signals</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-danger rounded-full"></div>
              <span className="text-muted-foreground">Sell Signals</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-muted-foreground">Price</span>
            </div>
          </div>
          <div className="text-muted-foreground">
            Last Price: <span className="text-foreground font-medium" data-testid="text-last-price">
              ${data[data.length - 1]?.Close.toFixed(2) || "N/A"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
