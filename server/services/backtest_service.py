import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from datetime import datetime
import logging
import os
import sys
import importlib.util
from .strategy_service import StrategyService
from .data_service import DataService

logger = logging.getLogger(__name__)

class BacktestService:
    """Enhanced service for running backtests with prebuilt models"""
    
    def __init__(self):
        self.strategy_service = StrategyService()
        self.attached_models_path = os.path.join(os.path.dirname(__file__), "../../attached_assets")
        self._load_attached_models()
        
    def _load_attached_models(self):
        """Load prebuilt models from attached_assets folder"""
        self.attached_models = {}
        if os.path.exists(self.attached_models_path):
            for filename in os.listdir(self.attached_models_path):
                if filename.endswith('.py') and 'backtest' in filename.lower():
                    model_name = filename.replace('.py', '')
                    self.attached_models[model_name] = os.path.join(self.attached_models_path, filename)
                    logger.info(f"Found attached model: {model_name}")
        
    def run_backtest(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Run a complete backtest with enhanced functionality"""
        try:
            # Extract configuration
            ticker = config['ticker']
            start_date = config['start_date']
            end_date = config['end_date']
            initial_capital = config['initial_capital']
            commission = config.get('commission', 0.001)
            strategy_config = config['strategy_config']
            
            # Fetch data with extended buffer for indicators
            data_response = DataService.fetch_stock_data(ticker, start_date, end_date)
            df = DataService.prepare_data_for_strategy(data_response['data'], 'technical')
            
            # Add comprehensive technical indicators
            df = self._add_comprehensive_indicators(df)
            
            # Execute strategies
            results = []
            for strategy in strategy_config:
                strategy_name = strategy['name']
                parameters = strategy['parameters']
                
                # Check if it's a prebuilt model
                if strategy_name in self.attached_models:
                    backtest_results = self._run_attached_model(
                        strategy_name, df, ticker, start_date, end_date, 
                        initial_capital, commission, parameters
                    )
                else:
                    # Use existing strategy system
                    strategy_instance = self.strategy_service.create_strategy_instance(strategy_name, parameters)
                    signals_df = strategy_instance.generate_signals(df)
                    backtest_results = self._execute_backtest(
                        signals_df, initial_capital, commission, strategy_name
                    )
                
                results.append(backtest_results)
            
            # Combine results if multiple strategies
            if len(results) == 1:
                final_results = results[0]
            else:
                final_results = self._combine_strategy_results(results)
            
            # Add enhanced metadata
            final_results['config'] = config
            final_results['data_metadata'] = data_response['metadata']
            final_results['enhanced_metrics'] = self._calculate_enhanced_metrics(final_results)
            
            return final_results
            
        except Exception as e:
            logger.error(f"Backtest failed: {str(e)}")
            raise
    
    def _add_comprehensive_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add comprehensive technical indicators to the dataframe"""
        try:
            import ta
            
            # Price-based indicators
            df['SMA_20'] = df['close'].rolling(window=20).mean()
            df['SMA_50'] = df['close'].rolling(window=50).mean()
            df['EMA_12'] = df['close'].ewm(span=12).mean()
            df['EMA_26'] = df['close'].ewm(span=26).mean()
            
            # Volatility indicators
            df['BB_upper'], df['BB_middle'], df['BB_lower'] = self._bollinger_bands(df['close'])
            df['ATR'] = ta.volatility.average_true_range(df['high'], df['low'], df['close'])
            
            # Momentum indicators
            df['RSI'] = ta.momentum.rsi(df['close'])
            df['MACD'] = ta.trend.macd_diff(df['close'])
            df['MACD_signal'] = ta.trend.macd_signal(df['close'])
            df['MACD_hist'] = ta.trend.macd(df['close'])
            
            # Volume indicators
            df['OBV'] = ta.volume.on_balance_volume(df['close'], df['volume'])
            df['VWAP'] = ta.volume.volume_weighted_average_price(df['high'], df['low'], df['close'], df['volume'])
            
            # Trend indicators
            df['ADX'] = ta.trend.adx(df['high'], df['low'], df['close'])
            df['AROON_up'] = ta.trend.aroon_up(df['high'], df['low'])
            df['AROON_down'] = ta.trend.aroon_down(df['high'], df['low'])
            
            return df
            
        except ImportError:
            logger.warning("TA-Lib not available, using basic indicators")
            return self._add_basic_indicators(df)
    
    def _add_basic_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add basic indicators without TA-Lib"""
        df['SMA_20'] = df['close'].rolling(window=20).mean()
        df['SMA_50'] = df['close'].rolling(window=50).mean()
        df['RSI'] = self._calculate_rsi(df['close'])
        return df
    
    def _bollinger_bands(self, prices: pd.Series, window: int = 20, num_std: float = 2):
        """Calculate Bollinger Bands"""
        sma = prices.rolling(window=window).mean()
        std = prices.rolling(window=window).std()
        upper = sma + (std * num_std)
        lower = sma - (std * num_std)
        return upper, sma, lower
    
    def _calculate_rsi(self, prices: pd.Series, window: int = 14) -> pd.Series:
        """Calculate RSI manually"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _run_attached_model(self, model_name: str, df: pd.DataFrame, ticker: str, 
                           start_date: str, end_date: str, initial_capital: float, 
                           commission: float, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Run one of the attached prebuilt models"""
        try:
            model_path = self.attached_models[model_name]
            
            # Load the model module
            spec = importlib.util.spec_from_file_location(model_name, model_path)
            model_module = importlib.util.module_from_spec(spec)
            
            # Add necessary globals to the module
            model_module.ticker = ticker
            model_module.start_date = start_date
            model_module.end_date = end_date
            model_module.df = df
            
            # Execute the model
            spec.loader.exec_module(model_module)
            
            # Extract results based on model type
            if hasattr(model_module, 'backtest_results'):
                results = model_module.backtest_results
            elif hasattr(model_module, 'portfolio_value'):
                results = self._format_model_results(model_module, model_name, df)
            else:
                # Fallback: run basic backtest on the processed data
                signals_df = self._extract_signals_from_model(model_module, df)
                results = self._execute_backtest(signals_df, initial_capital, commission, model_name)
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to run attached model {model_name}: {str(e)}")
            # Fallback to basic strategy
            return self._execute_basic_strategy(df, initial_capital, commission, model_name)
    
    def _format_model_results(self, model_module, model_name: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Format results from attached model"""
        try:
            portfolio_value = getattr(model_module, 'portfolio_value', [])
            trades = getattr(model_module, 'trades', [])
            signals = getattr(model_module, 'signals', None)
            
            if not portfolio_value:
                portfolio_value = [100000] * len(df)  # Default portfolio value
            
            if not signals:
                signals = {
                    'dates': df.index.strftime('%Y-%m-%d').tolist(),
                    'prices': df['close'].tolist(),
                    'signals': [0] * len(df)
                }
            
            metrics = self._calculate_metrics_from_portfolio(portfolio_value, trades)
            
            return {
                'strategy_name': model_name,
                'portfolio_value': portfolio_value,
                'dates': df.index.strftime('%Y-%m-%d').tolist(),
                'trades': trades,
                'metrics': metrics,
                'signals': signals
            }
            
        except Exception as e:
            logger.error(f"Error formatting model results: {str(e)}")
            return self._execute_basic_strategy(df, 100000, 0.001, model_name)
    
    def _extract_signals_from_model(self, model_module, df: pd.DataFrame) -> pd.DataFrame:
        """Extract trading signals from model output"""
        signals_df = df.copy()
        
        # Look for common signal column names
        signal_columns = ['signal', 'position', 'LONG', 'SHORT', 'buy_signal', 'sell_signal']
        
        for col in signal_columns:
            if hasattr(model_module, col) or col in df.columns:
                if hasattr(model_module, col):
                    signals_df['signal'] = getattr(model_module, col)
                else:
                    signals_df['signal'] = df[col]
                break
        
        if 'signal' not in signals_df.columns:
            # Generate basic signals based on price movement
            signals_df['signal'] = 0
            signals_df['position'] = 0
        else:
            # Convert signals to positions
            signals_df['position'] = signals_df['signal'].fillna(0)
        
        return signals_df
    
    def _execute_basic_strategy(self, df: pd.DataFrame, initial_capital: float, 
                               commission: float, strategy_name: str) -> Dict[str, Any]:
        """Execute a basic moving average strategy as fallback"""
        df['SMA_20'] = df['close'].rolling(window=20).mean()
        df['SMA_50'] = df['close'].rolling(window=50).mean()
        
        # Generate signals
        df['signal'] = 0
        df['signal'][df['SMA_20'] > df['SMA_50']] = 1
        df['signal'][df['SMA_20'] < df['SMA_50']] = -1
        
        df['position'] = df['signal'].fillna(0)
        
        return self._execute_backtest(df, initial_capital, commission, strategy_name)
    
    def _execute_backtest(self, signals_df: pd.DataFrame, initial_capital: float, 
                         commission: float, strategy_name: str) -> Dict[str, Any]:
        """Execute backtest for a single strategy with enhanced features"""
        
        # Initialize portfolio
        portfolio = pd.DataFrame(index=signals_df.index)
        portfolio['signal'] = signals_df['signal']
        portfolio['position'] = signals_df['position']
        portfolio['price'] = signals_df['close']
        
        # Calculate returns
        portfolio['returns'] = portfolio['price'].pct_change()
        portfolio['strategy_returns'] = portfolio['position'].shift(1) * portfolio['returns']
        
        # Account for commission and slippage
        portfolio['trades'] = portfolio['position'].diff().abs()
        portfolio['commission_cost'] = portfolio['trades'] * commission
        portfolio['slippage_cost'] = portfolio['trades'] * 0.0001  # 0.01% slippage
        portfolio['total_costs'] = portfolio['commission_cost'] + portfolio['slippage_cost']
        portfolio['strategy_returns'] -= portfolio['total_costs']
        
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
        """Calculate comprehensive performance metrics"""
        
        final_value = portfolio['portfolio_value'].iloc[-1]
        total_return = (final_value - initial_capital) / initial_capital * 100
        
        # Risk-adjusted returns
        returns = portfolio['strategy_returns'].dropna()
        sharpe_ratio = (returns.mean() / returns.std()) * np.sqrt(252) if returns.std() != 0 else 0
        sortino_ratio = (returns.mean() / returns[returns < 0].std()) * np.sqrt(252) if len(returns[returns < 0]) > 0 else 0
        
        # Drawdown analysis
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
        
        # Additional metrics
        calmar_ratio = total_return / abs(max_drawdown) if max_drawdown != 0 else 0
        volatility = returns.std() * np.sqrt(252) * 100
        
        return {
            'total_return': round(total_return, 2),
            'sharpe_ratio': round(sharpe_ratio, 2),
            'sortino_ratio': round(sortino_ratio, 2),
            'calmar_ratio': round(calmar_ratio, 2),
            'max_drawdown': round(max_drawdown, 2),
            'volatility': round(volatility, 2),
            'win_rate': round(win_rate, 1),
            'total_trades': len(trades),
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'avg_win': round(avg_win, 2),
            'avg_loss': round(avg_loss, 2),
            'profit_factor': round(profit_factor, 2),
            'final_value': round(final_value, 2)
        }
    
    def _calculate_metrics_from_portfolio(self, portfolio_value: List[float], 
                                        trades: List[Dict]) -> Dict[str, Any]:
        """Calculate metrics when only portfolio value is available"""
        if not portfolio_value or len(portfolio_value) < 2:
            return self._get_default_metrics()
        
        initial_value = portfolio_value[0]
        final_value = portfolio_value[-1]
        total_return = (final_value - initial_value) / initial_value * 100
        
        # Calculate basic metrics
        returns = np.diff(portfolio_value) / portfolio_value[:-1]
        volatility = np.std(returns) * np.sqrt(252) * 100
        sharpe_ratio = (np.mean(returns) / np.std(returns)) * np.sqrt(252) if np.std(returns) != 0 else 0
        
        # Basic drawdown
        cumulative = np.array(portfolio_value) / initial_value
        running_max = np.maximum.accumulate(cumulative)
        drawdown = (cumulative - running_max) / running_max
        max_drawdown = np.min(drawdown) * 100
        
        return {
            'total_return': round(total_return, 2),
            'sharpe_ratio': round(sharpe_ratio, 2),
            'sortino_ratio': round(sharpe_ratio, 2),  # Approximation
            'calmar_ratio': round(total_return / abs(max_drawdown) if max_drawdown != 0 else 0, 2),
            'max_drawdown': round(max_drawdown, 2),
            'volatility': round(volatility, 2),
            'win_rate': 50.0,  # Default
            'total_trades': len(trades),
            'winning_trades': len([t for t in trades if t.get('pnl', 0) > 0]),
            'losing_trades': len([t for t in trades if t.get('pnl', 0) < 0]),
            'avg_win': 0,
            'avg_loss': 0,
            'profit_factor': 1.0,
            'final_value': round(final_value, 2)
        }
    
    def _get_default_metrics(self) -> Dict[str, Any]:
        """Return default metrics when calculation fails"""
        return {
            'total_return': 0.0,
            'sharpe_ratio': 0.0,
            'sortino_ratio': 0.0,
            'calmar_ratio': 0.0,
            'max_drawdown': 0.0,
            'volatility': 0.0,
            'win_rate': 0.0,
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'avg_win': 0.0,
            'avg_loss': 0.0,
            'profit_factor': 0.0,
            'final_value': 100000.0
        }
    
    def _calculate_enhanced_metrics(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate additional enhanced metrics"""
        try:
            portfolio_value = results.get('portfolio_value', [])
            if not portfolio_value:
                return {}
            
            returns = np.diff(portfolio_value) / portfolio_value[:-1]
            
            # Information ratio
            benchmark_return = 0.08 / 252  # Assume 8% annual benchmark
            excess_returns = returns - benchmark_return
            information_ratio = np.mean(excess_returns) / np.std(excess_returns) if np.std(excess_returns) != 0 else 0
            
            # Omega ratio
            threshold = 0.0
            gains = returns[returns > threshold]
            losses = returns[returns <= threshold]
            omega_ratio = np.sum(gains - threshold) / abs(np.sum(losses - threshold)) if len(losses) > 0 else float('inf')
            
            return {
                'information_ratio': round(information_ratio * np.sqrt(252), 2),
                'omega_ratio': round(omega_ratio, 2),
                'skewness': round(float(pd.Series(returns).skew()), 2),
                'kurtosis': round(float(pd.Series(returns).kurtosis()), 2)
            }
            
        except Exception as e:
            logger.error(f"Error calculating enhanced metrics: {str(e)}")
            return {}
    
    def _combine_strategy_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine results from multiple strategies using ensemble approach"""
        if len(results) == 1:
            return results[0]
        
        # Simple ensemble: equal weight combination
        combined_portfolio = np.mean([r['portfolio_value'] for r in results], axis=0)
        
        # Combine signals (majority vote)
        all_signals = [r['signals']['signals'] for r in results]
        combined_signals = []
        for i in range(len(all_signals[0])):
            signal_sum = sum(signals[i] for signals in all_signals)
            combined_signals.append(1 if signal_sum > 0 else -1 if signal_sum < 0 else 0)
        
        # Use first strategy as template and update with combined data
        combined_result = results[0].copy()
        combined_result['strategy_name'] = 'Ensemble Strategy'
        combined_result['portfolio_value'] = combined_portfolio.tolist()
        combined_result['signals']['signals'] = combined_signals
        
        # Recalculate metrics for combined strategy
        trades = []  # Simplified - would need proper trade reconstruction
        combined_result['metrics'] = self._calculate_metrics_from_portfolio(
            combined_portfolio.tolist(), trades
        )
        
        return combined_result
