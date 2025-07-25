import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarketData, useTickerValidation } from "@/hooks/use-market-data";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Database } from "lucide-react";

interface DataSelectionProps {
  onDataLoaded: (data: any) => void;
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
}

export function DataSelection({ 
  onDataLoaded, 
  selectedTicker, 
  setSelectedTicker, 
  dateRange, 
  setDateRange 
}: DataSelectionProps) {
  const [inputTicker, setInputTicker] = useState(selectedTicker);
  const [selectedPreset, setSelectedPreset] = useState("1Y");
  const { toast } = useToast();

  const { data: validation } = useTickerValidation(inputTicker);
  const { data: marketData, isLoading, error } = useMarketData(
    selectedTicker, 
    dateRange.start, 
    dateRange.end
  );

  const presets = [
    { label: "1Y", days: 365 },
    { label: "2Y", days: 730 },
    { label: "5Y", days: 1825 },
  ];

  useEffect(() => {
    if (marketData) {
      onDataLoaded(marketData);
    }
  }, [marketData, onDataLoaded]);

  const handlePresetSelect = (preset: { label: string; days: number }) => {
    setSelectedPreset(preset.label);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - preset.days * 24 * 60 * 60 * 1000);
    
    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
  };

  const handleTickerSubmit = () => {
    if (validation?.valid) {
      setSelectedTicker(inputTicker.toUpperCase());
    } else {
      toast({
        title: "Invalid Ticker",
        description: "Please enter a valid stock ticker symbol",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="card-title">
            <Database className="mr-2 h-5 w-5 text-primary" />
            Data Selection
          </h2>
          <div className="tooltip">
            <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            <span className="tooltip-text">
              Select the financial instrument and time period for analysis
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ticker Input */}
        <div>
          <label className="input-label">Stock Ticker</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g., AAPL, TSLA, MSFT"
              value={inputTicker}
              onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleTickerSubmit()}
              className="pr-10"
              data-testid="input-ticker"
            />
            <div className="absolute right-3 top-3">
              {validation?.valid ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : inputTicker && (
                <AlertCircle className="h-4 w-4 text-danger" />
              )}
            </div>
          </div>
          {validation?.info && (
            <p className="text-xs text-muted-foreground mt-1">
              {validation.info.name} - {validation.info.sector}
            </p>
          )}
        </div>

        {/* Date Range */}
        <div>
          <label className="input-label">Time Period</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant={selectedPreset === preset.label ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect(preset)}
                className="btn-preset"
                data-testid={`button-preset-${preset.label}`}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="text-sm"
              data-testid="input-start-date"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="text-sm"
              data-testid="input-end-date"
            />
          </div>
        </div>

        {/* Data Preview */}
        {marketData && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="input-label">Data Preview</span>
              <span className="text-xs text-muted-foreground" data-testid="text-trading-days">
                {marketData.metadata.total_records} trading days
              </span>
            </div>
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Range</span>
                <span data-testid="text-price-range">
                  ${marketData.metadata.price_range.min.toFixed(2)} - ${marketData.metadata.price_range.max.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Volatility</span>
                <span data-testid="text-volatility">
                  {marketData.metadata.volatility.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Volume</span>
                <span data-testid="text-avg-volume">
                  {(marketData.metadata.avg_volume / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>
        )}

        <Button 
          className="btn-primary w-full" 
          onClick={handleTickerSubmit}
          disabled={!validation?.valid || isLoading}
          data-testid="button-load-data"
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Loading Data
            </>
          ) : (
            <>
              <i className="fas fa-download mr-2"></i>
              Load Data
            </>
          )}
        </Button>

        {error && (
          <div className="text-sm text-danger">
            Failed to load data. Please try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
