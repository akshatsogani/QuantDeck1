import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from datetime import datetime
import logging
from .strategy_service import StrategyService
from .data_service import DataService

logger = logging.getLogger(__name__)

class BacktestService:
    """Service for running backtests"""
    
    def __init__(self):
        self.strategy_service = StrategyService()
        
    def run_backtest(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Run a complete backtest"""
        try:
            # Extract configuration
            ticker = config['ticker']
            start_date = config['start_date']
            end_date = config['end_date']
            initial_capital = config['initial_capital']
            commission = config.get('commission', 0.001)
            strategy_config = config['strategy_config']
            
            # Fetch data
            data_response = DataService.fetch_stock_data(ticker, start_date, end_date)
            df = DataService.prepare_data_for_strategy(data_response['data'], 'technical')
            
            # Execute strategies
            results = []
            for strategy in strategy_config:
                strategy_name = strategy['name']
                parameters = strategy['parameters']
                
                # Create strategy instance and generate signals
                strategy_instance = self.strategy_service.create_strategy_instance(strategy_name, parameters)
                signals_df = strategy_instance.generate_signals(df)
                
                # Run backtest for this strategy
                backtest_results = self._execute_backtest(
                    signals_df, initial_capital, commission, strategy_name
                )
                results.append(backtest_results)
            
            # Combine results if multiple strategies
            if len(results) == 1:
                final_results = results[0]
            else:
                final_results = self._combine_strategy_results(results)
            
            # Add metadata
            final_results['config'] = config
            final_results['data_metadata'] = data_response['metadata']
            
            return final_results
            
        except Exception as e:
            logger.error(f"Backtest failed: {str(e)}")
            raise
    
    def _execute_backtest(self, signals_df: pd.DataFrame, initial_capital: float, 
                         commission: float, strategy_name: str) -> Dict[str, Any]:
        """Execute backtest for a single strategy"""
        
        # Initialize portfolio
        portfolio = pd.DataFrame(index=signals_df.index)
        portfolio['signal'] = signals_df['signal']
        portfolio['position'] = signals_df['position']
        portfolio['price'] = signals_df['close']
        
        # Calculate returns
        portfolio['returns'] = portfolio['price'].pct_change()
        portfolio['strategy_returns'] = portfolio['position'].shift(1) * portfolio['returns']
        
        # Account for commission
        portfolio['trades'] = portfolio['position'].diff().abs()
        portfolio['commission_cost'] = portfolio['trades'] * commission
        portfolio['strategy_returns'] -= portfolio['commission_cost']
        
        # Calculate cumulative returns
        portfolio['cumulative_returns'] = (1 + portfolio['strategy_returns']).cumprod()
        portfolio['portfolio_value'] = initial_capital * portfolio['cumulative_returns']
        
        # Extract trades
        trades = self._extract_trades(portfolio)
        
        # Calculate metrics
        metrics = self._calculate_metrics(portfolio, trades, initial_capital)
        
        return {
            'strategy_name': strategy_name,
            'portfolio_value': portfolio['portfolio_value'].tolist(),
            'dates': portfolio.index.strftime('%Y-%m-%d').tolist(),
            'trades': trades,
            'metrics': metrics,
            'signals': {
                'dates': signals_df.index.strftime('%Y-%m-%d').tolist(),
                'prices': signals_df['close'].tolist(),
                'signals': signals_df['signal'].tolist()
            }
        }
    
    def _extract_trades(self, portfolio: pd.DataFrame) -> List[Dict[str, Any]]:
        """Extract individual trades from portfolio"""
        trades = []
        position = 0
        entry_price = 0
        entry_date = None
        
        for date, row in portfolio.iterrows():
            if row['position'] != position:
                if position != 0:  # Closing existing position
                    exit_price = row['price']
                    pnl = (exit_price - entry_price) * position
                    return_pct = (pnl / (entry_price * abs(position))) * 100
                    
                    trades.append({
                        'entry_date': entry_date.strftime('%Y-%m-%d'),
                        'exit_date': date.strftime('%Y-%m-%d'),
                        'side': 'LONG' if position > 0 else 'SHORT',
                        'entry_price': round(entry_price, 2),
                        'exit_price': round(exit_price, 2),
                        'quantity': abs(position),
                        'pnl': round(pnl, 2),
                        'return_pct': round(return_pct, 2)
                    })
                
                if row['position'] != 0:  # Opening new position
                    position = row['position']
                    entry_price = row['price']
                    entry_date = date
                else:
                    position = 0
        
        return trades
    
    def _calculate_metrics(self, portfolio: pd.DataFrame, trades: List[Dict], 
                          initial_capital: float) -> Dict[str, Any]:
        """Calculate performance metrics"""
        
        final_value = portfolio['portfolio_value'].iloc[-1]
        total_return = (final_value - initial_capital) / initial_capital * 100
        
        # Sharpe ratio
        returns = portfolio['strategy_returns'].dropna()
        sharpe_ratio = (returns.mean() / returns.std()) * np.sqrt(252) if returns.std() != 0 else 0
        
        # Maximum drawdown
        cumulative = portfolio['cumulative_returns']
        running_max = cumulative.expanding().max()
        drawdown = (cumulative - running_max) / running_max
        max_drawdown = drawdown.min() * 100
        
        # Trade statistics
        winning_trades = [t for t in trades if t['pnl'] > 0]
        losing_trades = [t for t in trades if t['pnl'] < 0]
        
        win_rate = len(winning_trades) / len(trades) * 100 if trades else 0
        avg_win = np.mean([t['pnl'] for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t['pnl'] for t in losing_trades]) if losing_trades else 0
        profit_factor = abs(avg_win / avg_loss) if avg_loss != 0 else float('inf')
        
        return {
            'total_return': round(total_return, 2),
            'sharpe_ratio': round(sharpe_ratio, 2),
            'max_drawdown': round(max_drawdown, 2),
            'win_rate': round(win_rate, 1),
            'total_trades': len(trades),
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'avg_win': round(avg_win, 2),
            'avg_loss': round(avg_loss, 2),
            'profit_factor': round(profit_factor, 2),
            'final_value': round(final_value, 2)
        }
    
    def _combine_strategy_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine results from multiple strategies"""
        # For simplicity, we'll just return the first strategy's results
        # In a real implementation, you might want to combine or ensemble the strategies
        return results[0]
