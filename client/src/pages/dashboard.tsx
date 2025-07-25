import { useState, useCallback } from "react";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { DataSelection } from "@/components/sections/DataSelection";
import { StrategyBuilder } from "@/components/sections/StrategyBuilder";
import { BacktestEngine } from "@/components/sections/BacktestEngine";
import { ResultsDashboard } from "@/components/sections/ResultsDashboard";
import { PriceChart } from "@/components/charts/PriceChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StrategyConfig, MarketDataResponse, BacktestResults } from "@/types/trading";
import { ChartLine, Save, Download, Play } from "lucide-react";

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [marketData, setMarketData] = useState<MarketDataResponse | null>(null);
  const [selectedStrategies, setSelectedStrategies] = useState<StrategyConfig[]>([]);
  const [backtestResults, setBacktestResults] = useState<BacktestResults | null>(null);

  const steps = [
    { id: 1, title: "Data Selection" },
    { id: 2, title: "Strategy Builder" },
    { id: 3, title: "Backtesting" },
    { id: 4, title: "Results" }
  ];

  const handleDataLoaded = useCallback((data: MarketDataResponse) => {
    setMarketData(data);
    setCurrentStep(2);
  }, []);

  const handleBacktestComplete = useCallback((results: BacktestResults) => {
    setBacktestResults(results);
    setCurrentStep(4);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ChartLine className="text-primary text-2xl" />
                <h1 className="text-xl font-bold text-foreground">QuantDeck</h1>
                <span className="text-sm text-muted-foreground">by Akshat Sogani</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" data-testid="button-save-config">
                <Save className="mr-2 h-4 w-4" />
                Save Config
              </Button>
              <Button variant="outline" data-testid="button-export">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button 
                className="btn-primary"
                onClick={() => setCurrentStep(3)}
                disabled={selectedStrategies.length === 0}
                data-testid="button-run-backtest-header"
              >
                <Play className="mr-2 h-4 w-4" />
                Run Backtest
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ProgressSteps steps={steps} currentStep={currentStep} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Data & Strategy */}
          <div className="lg:col-span-1 space-y-6">
            {/* Section 1: Data Selection */}
            <DataSelection
              onDataLoaded={handleDataLoaded}
              selectedTicker={selectedTicker}
              setSelectedTicker={setSelectedTicker}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />

            {/* Section 2: Strategy Builder */}
            <StrategyBuilder
              selectedStrategies={selectedStrategies}
              onStrategiesChange={setSelectedStrategies}
            />

            {/* Strategy Parameters Panel */}
            {selectedStrategies.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-card-foreground mb-4">
                    Strategy Parameters
                  </h3>
                  <div className="space-y-4">
                    {selectedStrategies.map((strategy) => (
                      <div key={strategy.id} className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">
                          {strategy.name}
                        </h4>
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(strategy.parameters)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center - Charts & Visualization */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            {marketData && (
              <PriceChart
                data={marketData.data}
                signals={backtestResults?.signals}
              />
            )}

            {/* Section 3: Backtesting Engine */}
            <BacktestEngine
              ticker={selectedTicker}
              dateRange={dateRange}
              strategies={selectedStrategies}
              onBacktestComplete={handleBacktestComplete}
            />

            {/* Section 4: Results Dashboard */}
            <ResultsDashboard results={backtestResults} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              © Akshat Sogani | 
              <a 
                href="https://www.linkedin.com/in/akshat-sogani/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors ml-1"
              >
                LinkedIn
              </a>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Powered by QuantDeck Engine</span>
              <span>•</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
