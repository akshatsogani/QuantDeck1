export interface MarketData {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface StrategyConfig {
  id: string;
  name: string;
  type: 'technical' | 'ml' | 'custom';
  description: string;
  parameters: Record<string, any>;
  isActive?: boolean;
}

export interface BacktestConfig {
  ticker: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  strategyConfig: StrategyConfig[];
}

export interface Trade {
  entry_date: string;
  exit_date: string;
  side: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  return_pct: number;
}

export interface BacktestMetrics {
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  final_value: number;
}

export interface BacktestResults {
  strategy_name: string;
  portfolio_value: number[];
  dates: string[];
  trades: Trade[];
  metrics: BacktestMetrics;
  signals: {
    dates: string[];
    prices: number[];
    signals: number[];
  };
}

export interface Backtest {
  id: string;
  ticker: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  strategyConfig: StrategyConfig[];
  results?: BacktestResults;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
}

export interface TickerInfo {
  symbol: string;
  name: string;
  sector: string;
  market_cap?: number;
  current_price?: number;
}

export interface DataMetadata {
  start_date: string;
  end_date: string;
  total_records: number;
  price_range: {
    min: number;
    max: number;
  };
  avg_volume: number;
  volatility: number;
}

export interface MarketDataResponse {
  ticker: string;
  data: MarketData[];
  metadata: DataMetadata;
}
