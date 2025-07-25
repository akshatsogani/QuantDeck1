import pandas as pd
import numpy as np
from typing import Dict, Any
from .base_strategy import BaseStrategy

class MACDStrategy(BaseStrategy):
    """MACD trend following strategy"""
    
    def __init__(self, parameters: Dict[str, Any]):
        super().__init__(parameters)
        self.fast_period = parameters.get('fastPeriod', 12)
        self.slow_period = parameters.get('slowPeriod', 26)
        self.signal_period = parameters.get('signalPeriod', 9)
        
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate signals based on MACD"""
        df = data.copy()
        
        # Calculate MACD
        ema_fast = df['close'].ewm(span=self.fast_period).mean()
        ema_slow = df['close'].ewm(span=self.slow_period).mean()
        df['MACD'] = ema_fast - ema_slow
        df['MACD_Signal'] = df['MACD'].ewm(span=self.signal_period).mean()
        df['MACD_Histogram'] = df['MACD'] - df['MACD_Signal']
        
        # Generate signals
        df['signal'] = 0
        
        # Buy when MACD crosses above signal line, sell when crosses below
        df.loc[(df['MACD'] > df['MACD_Signal']) & (df['MACD'].shift(1) <= df['MACD_Signal'].shift(1)), 'signal'] = 1
        df.loc[(df['MACD'] < df['MACD_Signal']) & (df['MACD'].shift(1) >= df['MACD_Signal'].shift(1)), 'signal'] = -1
        
        # Calculate positions
        df['position'] = df['signal'].replace(to_replace=0, method='ffill').fillna(0)
        
        return df[['close', 'MACD', 'MACD_Signal', 'MACD_Histogram', 'signal', 'position']]
    
    def get_parameter_config(self) -> Dict[str, Any]:
        """Return parameter configuration for UI"""
        return {
            'fastPeriod': {
                'type': 'slider',
                'min': 5,
                'max': 20,
                'default': 12,
                'step': 1,
                'label': 'Fast Period'
            },
            'slowPeriod': {
                'type': 'slider',
                'min': 20,
                'max': 50,
                'default': 26,
                'step': 1,
                'label': 'Slow Period'
            },
            'signalPeriod': {
                'type': 'slider',
                'min': 5,
                'max': 15,
                'default': 9,
                'step': 1,
                'label': 'Signal Period'
            }
        }
