import pandas as pd
import numpy as np
import ta
from typing import Dict, Any
from .base_strategy import BaseStrategy
from datetime import datetime, timedelta

class ComprehensiveBacktestStrategy(BaseStrategy):
    """
    Comprehensive backtesting strategy that uses all technical indicators
    Based on the attached_assets comprehensive backtesting model
    """
    
    def __init__(self, parameters: Dict[str, Any]):
        super().__init__(parameters)
        self.keltner_period = parameters.get('keltner_period', 10)
        self.rsi_period = parameters.get('rsi_period', 14)
        self.bb_period = parameters.get('bb_period', 20)
        self.macd_fast = parameters.get('macd_fast', 12)
        self.macd_slow = parameters.get('macd_slow', 26)
        self.macd_signal = parameters.get('macd_signal', 9)
        
    def get_parameter_config(self) -> Dict[str, Any]:
        return {
            'keltner_period': {'type': 'int', 'default': 10, 'min': 5, 'max': 50},
            'rsi_period': {'type': 'int', 'default': 14, 'min': 5, 'max': 50},
            'bb_period': {'type': 'int', 'default': 20, 'min': 5, 'max': 50},
            'macd_fast': {'type': 'int', 'default': 12, 'min': 5, 'max': 50},
            'macd_slow': {'type': 'int', 'default': 26, 'min': 10, 'max': 100},
            'macd_signal': {'type': 'int', 'default': 9, 'min': 5, 'max': 20}
        }
    
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate comprehensive trading signals using multiple indicators"""
        data = df.copy()
        
        # Add previous close for comparison
        data['close_prev'] = data['close'].shift(1)
        
        # Keltner Channel Strategy
        keltner_signals = self._keltner_channel_strategy(data)
        
        # RSI Strategy
        rsi_signals = self._rsi_strategy(data)
        
        # Bollinger Bands Strategy
        bb_signals = self._bollinger_bands_strategy(data)
        
        # MACD Strategy
        macd_signals = self._macd_strategy(data)
        
        # Moving Average Strategy
        ma_signals = self._moving_average_strategy(data)
        
        # Combine signals using ensemble approach
        data['signal'] = self._combine_signals([
            keltner_signals, rsi_signals, bb_signals, macd_signals, ma_signals
        ])
        
        # Convert signals to positions
        data['position'] = data['signal'].fillna(0)
        
        return data
    
    def _keltner_channel_strategy(self, df: pd.DataFrame) -> pd.Series:
        """Keltner Channel based strategy"""
        # Calculate Keltner Channel
        keltner = ta.volatility.KeltnerChannel(
            df['high'], df['low'], df['close'], 
            window=self.keltner_period
        )
        
        df['k_band_ub'] = keltner.keltner_channel_hband()
        df['k_band_lb'] = keltner.keltner_channel_lband()
        
        # Generate signals
        long_entry = (df['close'] <= df['k_band_lb']) & (df['close_prev'] > df['k_band_lb'])
        short_entry = (df['close'] >= df['k_band_ub']) & (df['close_prev'] < df['k_band_ub'])
        
        signals = pd.Series(0, index=df.index)
        signals[long_entry] = 1
        signals[short_entry] = -1
        
        return signals.shift(1)  # Shift to avoid look-ahead bias
    
    def _rsi_strategy(self, df: pd.DataFrame) -> pd.Series:
        """RSI based strategy"""
        df['rsi'] = ta.momentum.rsi(df['close'], window=self.rsi_period)
        
        # Generate signals
        oversold = df['rsi'] < 30
        overbought = df['rsi'] > 70
        
        signals = pd.Series(0, index=df.index)
        signals[oversold] = 1  # Buy when oversold
        signals[overbought] = -1  # Sell when overbought
        
        return signals
    
    def _bollinger_bands_strategy(self, df: pd.DataFrame) -> pd.Series:
        """Bollinger Bands based strategy"""
        bb = ta.volatility.BollingerBands(df['close'], window=self.bb_period)
        df['bb_upper'] = bb.bollinger_hband()
        df['bb_lower'] = bb.bollinger_lband()
        df['bb_middle'] = bb.bollinger_mavg()
        
        # Generate signals
        buy_signal = (df['close'] <= df['bb_lower']) & (df['close_prev'] > df['bb_lower'])
        sell_signal = (df['close'] >= df['bb_upper']) & (df['close_prev'] < df['bb_upper'])
        
        signals = pd.Series(0, index=df.index)
        signals[buy_signal] = 1
        signals[sell_signal] = -1
        
        return signals
    
    def _macd_strategy(self, df: pd.DataFrame) -> pd.Series:
        """MACD based strategy"""
        macd_line = ta.trend.macd_diff(df['close'], window_fast=self.macd_fast, 
                                      window_slow=self.macd_slow, window_sign=self.macd_signal)
        macd_signal_line = ta.trend.macd_signal(df['close'], window_fast=self.macd_fast, 
                                               window_slow=self.macd_slow, window_sign=self.macd_signal)
        
        df['macd'] = macd_line
        df['macd_signal'] = macd_signal_line
        df['macd_prev'] = df['macd'].shift(1)
        df['macd_signal_prev'] = df['macd_signal'].shift(1)
        
        # Generate signals
        bullish_crossover = (df['macd'] > df['macd_signal']) & (df['macd_prev'] <= df['macd_signal_prev'])
        bearish_crossover = (df['macd'] < df['macd_signal']) & (df['macd_prev'] >= df['macd_signal_prev'])
        
        signals = pd.Series(0, index=df.index)
        signals[bullish_crossover] = 1
        signals[bearish_crossover] = -1
        
        return signals
    
    def _moving_average_strategy(self, df: pd.DataFrame) -> pd.Series:
        """Moving Average based strategy"""
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['sma_50'] = df['close'].rolling(window=50).mean()
        
        # Generate signals
        bullish = df['sma_20'] > df['sma_50']
        bearish = df['sma_20'] < df['sma_50']
        
        signals = pd.Series(0, index=df.index)
        signals[bullish] = 1
        signals[bearish] = -1
        
        return signals
    
    def _combine_signals(self, signal_list: list) -> pd.Series:
        """Combine multiple signals using ensemble voting"""
        # Stack all signals
        signal_matrix = pd.concat(signal_list, axis=1)
        
        # Calculate weighted sum (equal weights for now)
        weights = [1.0] * len(signal_list)
        weighted_signals = signal_matrix.multiply(weights, axis=1).sum(axis=1)
        
        # Convert to final signals based on majority vote
        final_signals = pd.Series(0, index=signal_matrix.index)
        final_signals[weighted_signals > 1] = 1    # Buy if majority bullish
        final_signals[weighted_signals < -1] = -1  # Sell if majority bearish
        
        return final_signals
    
    def calculate_risk_metrics(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate additional risk metrics"""
        returns = df['close'].pct_change().dropna()
        
        # Value at Risk (VaR)
        var_95 = np.percentile(returns, 5)
        var_99 = np.percentile(returns, 1)
        
        # Expected Shortfall (Conditional VaR)
        es_95 = returns[returns <= var_95].mean()
        es_99 = returns[returns <= var_99].mean()
        
        # Maximum Drawdown
        cumulative = (1 + returns).cumprod()
        running_max = cumulative.expanding().max()
        drawdown = (cumulative - running_max) / running_max
        max_drawdown = drawdown.min()
        
        return {
            'var_95': var_95,
            'var_99': var_99,
            'expected_shortfall_95': es_95,
            'expected_shortfall_99': es_99,
            'max_drawdown': max_drawdown,
            'volatility': returns.std() * np.sqrt(252)
        }