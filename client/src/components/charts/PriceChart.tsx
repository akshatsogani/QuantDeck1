import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
      <CardHeader>
        <h3 className="card-title">
          <i className="fas fa-chart-line mr-2 text-primary"></i>
          Price Chart & Signals
        </h3>
      </CardHeader>
      <CardContent>
        <div className="h-96 bg-card rounded-lg">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              style={{ backgroundColor: 'transparent' }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#D1D5DB' }}
              />
              
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                name="Price"
                connectNulls={false}
              />
              
              {/* Moving Average if available */}
              {indicators?.MA && (
                <Line 
                  type="monotone" 
                  dataKey="MA" 
                  stroke="#F59E0B" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="MA(20)"
                  connectNulls={false}
                />
              )}
              
              {/* Buy signals */}
              <Line 
                type="monotone" 
                dataKey="buySignal" 
                stroke="#10B981" 
                strokeWidth={0}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                name="Buy Signal"
                connectNulls={false}
              />
              
              {/* Sell signals */}
              <Line 
                type="monotone" 
                dataKey="sellSignal" 
                stroke="#EF4444" 
                strokeWidth={0}
                dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                name="Sell Signal"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Buy Signals</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-muted-foreground">Sell Signals</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
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
