import pandas as pd
import numpy as np
from typing import Dict, Any
from .base_strategy import BaseStrategy

class MovingAverageStrategy(BaseStrategy):
    """Moving Average crossover strategy"""
    
    def __init__(self, parameters: Dict[str, Any]):
        super().__init__(parameters)
        self.period = parameters.get('period', 20)
        self.ma_type = parameters.get('type', 'SMA')
        
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate signals based on moving average crossover"""
        df = data.copy()
        
        # Calculate moving average
        if self.ma_type == 'SMA':
            df['MA'] = df['close'].rolling(window=self.period).mean()
        elif self.ma_type == 'EMA':
            df['MA'] = df['close'].ewm(span=self.period).mean()
        else:
            df['MA'] = df['close'].rolling(window=self.period).mean()
        
        # Generate signals
        df['signal'] = 0
        df['position'] = 0
        
        # Buy when price crosses above MA, sell when crosses below
        df.loc[df['close'] > df['MA'], 'signal'] = 1
        df.loc[df['close'] < df['MA'], 'signal'] = -1
        
        # Only trigger on crossovers
        df['prev_signal'] = df['signal'].shift(1)
        df['signal'] = df['signal'].where(df['signal'] != df['prev_signal'], 0)
        
        # Calculate positions
        df['position'] = df['signal'].replace(to_replace=0, method='ffill').fillna(0)
        
        return df[['close', 'MA', 'signal', 'position']]
    
    def get_parameter_config(self) -> Dict[str, Any]:
        """Return parameter configuration for UI"""
        return {
            'period': {
                'type': 'slider',
                'min': 5,
                'max': 200,
                'default': 20,
                'step': 1,
                'label': 'MA Period'
            },
            'type': {
                'type': 'select',
                'options': ['SMA', 'EMA', 'WMA'],
                'default': 'SMA',
                'label': 'MA Type'
            }
        }
