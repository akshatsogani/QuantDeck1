import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useCreateBacktest, useRunBacktest } from "@/hooks/use-backtest";
import { useToast } from "@/hooks/use-toast";
import { BacktestConfig, StrategyConfig } from "@/types/trading";
import { Rocket } from "lucide-react";

interface BacktestEngineProps {
  ticker: string;
  dateRange: { start: string; end: string };
  strategies: StrategyConfig[];
  onBacktestComplete: (results: any) => void;
}

export function BacktestEngine({ 
  ticker, 
  dateRange, 
  strategies, 
  onBacktestComplete 
}: BacktestEngineProps) {
  const [config, setConfig] = useState({
    initialCapital: 100000,
    commission: 0.1,
    enableStopLoss: true,
    enableTakeProfit: false,
  });
  
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const { toast } = useToast();
  const createBacktest = useCreateBacktest();
  const runBacktest = useRunBacktest();

  const handleRunBacktest = async () => {
    if (!ticker || strategies.length === 0) {
      toast({
        title: "Missing Configuration",
        description: "Please select a ticker and at least one strategy",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRunning(true);
      setProgress(0);

      // Create backtest configuration
      const backtestConfig: BacktestConfig = {
        ticker,
        startDate: dateRange.start,
        endDate: dateRange.end,
        initialCapital: config.initialCapital,
        commission: config.commission / 100, // Convert percentage to decimal
        strategyConfig: strategies,
      };

      // Create backtest
      const backtest = await createBacktest.mutateAsync(backtestConfig);
      setProgress(25);

      // Run backtest
      const results = await runBacktest.mutateAsync(backtest.id);
      setProgress(100);

      onBacktestComplete(results);
      
      toast({
        title: "Backtest Complete",
        description: "Your strategy has been successfully backtested",
      });

    } catch (error) {
      console.error("Backtest failed:", error);
      toast({
        title: "Backtest Failed",
        description: "An error occurred while running the backtest",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="card-title">
            <Rocket className="mr-2 h-5 w-5 text-warning" />
            Backtesting Engine
          </h2>
          <div className="text-sm text-muted-foreground">
            Test your strategy against historical data
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Initial Capital</label>
            <Input
              type="number"
              value={config.initialCapital}
              onChange={(e) => setConfig({ ...config, initialCapital: Number(e.target.value) })}
              data-testid="input-initial-capital"
            />
          </div>
          <div>
            <label className="input-label">Commission (%)</label>
            <Input
              type="number"
              step="0.01"
              value={config.commission}
              onChange={(e) => setConfig({ ...config, commission: Number(e.target.value) })}
              data-testid="input-commission"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="stopLoss"
              checked={config.enableStopLoss}
              onCheckedChange={(checked) => 
                setConfig({ ...config, enableStopLoss: !!checked })
              }
              data-testid="checkbox-stop-loss"
            />
            <label htmlFor="stopLoss" className="text-sm">
              Enable stop loss
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="takeProfit"
              checked={config.enableTakeProfit}
              onCheckedChange={(checked) => 
                setConfig({ ...config, enableTakeProfit: !!checked })
              }
              data-testid="checkbox-take-profit"
            />
            <label htmlFor="takeProfit" className="text-sm">
              Enable take profit
            </label>
          </div>
        </div>

        {/* Backtest Progress */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Running backtest...</span>
              <span className="text-sm text-muted-foreground" data-testid="text-progress">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button 
          className="btn-primary w-full" 
          onClick={handleRunBacktest}
          disabled={isRunning || !ticker || strategies.length === 0}
          data-testid="button-run-backtest"
        >
          {isRunning ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Running Backtest
            </>
          ) : (
            <>
              <i className="fas fa-play mr-2"></i>
              Run Backtest
            </>
          )}
        </Button>

        {strategies.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Please select at least one strategy to run a backtest
          </p>
        )}
      </CardContent>
    </Card>
  );
}
