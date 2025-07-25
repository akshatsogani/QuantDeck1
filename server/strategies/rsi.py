import pandas as pd
import numpy as np
from typing import Dict, Any
from .base_strategy import BaseStrategy

class RSIStrategy(BaseStrategy):
    """RSI momentum strategy"""
    
    def __init__(self, parameters: Dict[str, Any]):
        super().__init__(parameters)
        self.period = parameters.get('period', 14)
        self.overbought = parameters.get('overbought', 70)
        self.oversold = parameters.get('oversold', 30)
        
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate signals based on RSI"""
        df = data.copy()
        
        # Calculate RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=self.period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=self.period).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # Generate signals
        df['signal'] = 0
        
        # Buy when RSI < oversold, sell when RSI > overbought
        df.loc[df['RSI'] < self.oversold, 'signal'] = 1
        df.loc[df['RSI'] > self.overbought, 'signal'] = -1
        
        # Calculate positions
        df['position'] = df['signal'].replace(to_replace=0, method='ffill').fillna(0)
        
        return df[['close', 'RSI', 'signal', 'position']]
    
    def get_parameter_config(self) -> Dict[str, Any]:
        """Return parameter configuration for UI"""
        return {
            'period': {
                'type': 'slider',
                'min': 5,
                'max': 30,
                'default': 14,
                'step': 1,
                'label': 'RSI Period'
            },
            'overbought': {
                'type': 'slider',
                'min': 60,
                'max': 90,
                'default': 70,
                'step': 1,
                'label': 'Overbought Level'
            },
            'oversold': {
                'type': 'slider',
                'min': 10,
                'max': 40,
                'default': 30,
                'step': 1,
                'label': 'Oversold Level'
            }
        }
