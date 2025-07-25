import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/ui/metric-card";
import { EquityChart } from "@/components/charts/EquityChart";
import { BacktestResults, Trade } from "@/types/trading";
import { BarChart3, Download, Image } from "lucide-react";

interface ResultsDashboardProps {
  results: BacktestResults | null;
}

export function ResultsDashboard({ results }: ResultsDashboardProps) {
  const [tradeFilter, setTradeFilter] = useState("");
  const [tradeType, setTradeType] = useState("all");

  if (!results) {
    return (
      <Card>
        <CardHeader>
          <h2 className="card-title">
            <BarChart3 className="mr-2 h-5 w-5 text-success" />
            Performance Results
          </h2>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Run a backtest to see performance results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { metrics, trades, portfolio_value, dates } = results;

  // Filter trades based on search and type
  const filteredTrades = trades.filter(trade => {
    const matchesFilter = !tradeFilter || 
      trade.entry_date.includes(tradeFilter) ||
      trade.side.toLowerCase().includes(tradeFilter.toLowerCase());
    
    const matchesType = tradeType === "all" ||
      (tradeType === "winners" && trade.pnl > 0) ||
      (tradeType === "losers" && trade.pnl < 0);
    
    return matchesFilter && matchesType;
  });

  // Prepare equity curve data
  const equityData = dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString(),
    value: portfolio_value[index],
  }));

  const handleExportCSV = () => {
    const csvContent = [
      ["Date", "Type", "Entry", "Exit", "PnL", "Return %"].join(","),
      ...filteredTrades.map(trade => [
        trade.entry_date,
        trade.side,
        trade.entry_price,
        trade.exit_price,
        trade.pnl,
        trade.return_pct
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backtest_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="card-title">
            <BarChart3 className="mr-2 h-5 w-5 text-success" />
            Performance Results
          </h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              data-testid="button-export-csv"
            >
              <Download className="mr-1 h-3 w-3" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              data-testid="button-save-chart"
            >
              <Image className="mr-1 h-3 w-3" />
              Save Chart
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Return"
            value={`${metrics.total_return}%`}
            trend={metrics.total_return > 0 ? "positive" : "negative"}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={metrics.sharpe_ratio}
            trend={metrics.sharpe_ratio > 1 ? "positive" : "neutral"}
          />
          <MetricCard
            label="Max Drawdown"
            value={`${metrics.max_drawdown}%`}
            trend="negative"
          />
          <MetricCard
            label="Win Rate"
            value={`${metrics.win_rate}%`}
            trend={metrics.win_rate > 50 ? "positive" : "negative"}
          />
        </div>

        {/* Equity Curve */}
        <EquityChart data={equityData} />

        {/* Trade Log */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-card-foreground">Trade Log</h3>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Filter trades..."
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className="w-40 text-xs"
                data-testid="input-trade-filter"
              />
              <Select value={tradeType} onValueChange={setTradeType}>
                <SelectTrigger className="w-32 text-xs" data-testid="select-trade-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="winners">Winners Only</SelectItem>
                  <SelectItem value="losers">Losers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="trade-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>PnL</th>
                  <th>Return %</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade, index) => (
                  <tr key={index} data-testid={`trade-row-${index}`}>
                    <td>{trade.entry_date}</td>
                    <td>
                      <span className={`badge-${trade.side === 'LONG' ? 'success' : 'danger'}`}>
                        {trade.side}
                      </span>
                    </td>
                    <td>${trade.entry_price.toFixed(2)}</td>
                    <td>${trade.exit_price?.toFixed(2) || 'N/A'}</td>
                    <td className={trade.pnl > 0 ? 'text-success' : 'text-danger'}>
                      {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </td>
                    <td className={trade.return_pct > 0 ? 'text-success' : 'text-danger'}>
                      {trade.return_pct > 0 ? '+' : ''}{trade.return_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span data-testid="text-trade-summary">
              Showing {filteredTrades.length} of {trades.length} trades
            </span>
            <div className="text-sm">
              <span className="text-success">
                Wins: {metrics.winning_trades}
              </span>
              {" • "}
              <span className="text-danger">
                Losses: {metrics.losing_trades}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
