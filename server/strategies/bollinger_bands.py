import pandas as pd
import numpy as np
from typing import Dict, Any
from .base_strategy import BaseStrategy

class BollingerBandsStrategy(BaseStrategy):
    """Bollinger Bands mean reversion strategy"""
    
    def __init__(self, parameters: Dict[str, Any]):
        super().__init__(parameters)
        self.period = parameters.get('period', 20)
        self.std_dev = parameters.get('stddev', 2)
        
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate signals based on Bollinger Bands"""
        df = data.copy()
        
        # Calculate Bollinger Bands
        df['BB_Middle'] = df['close'].rolling(window=self.period).mean()
        bb_std = df['close'].rolling(window=self.period).std()
        df['BB_Upper'] = df['BB_Middle'] + (bb_std * self.std_dev)
        df['BB_Lower'] = df['BB_Middle'] - (bb_std * self.std_dev)
        
        # Generate signals
        df['signal'] = 0
        
        # Buy when price touches lower band, sell when touches upper band
        df.loc[df['close'] <= df['BB_Lower'], 'signal'] = 1
        df.loc[df['close'] >= df['BB_Upper'], 'signal'] = -1
        
        # Calculate positions
        df['position'] = df['signal'].replace(to_replace=0, method='ffill').fillna(0)
        
        return df[['close', 'BB_Upper', 'BB_Middle', 'BB_Lower', 'signal', 'position']]
    
    def get_parameter_config(self) -> Dict[str, Any]:
        """Return parameter configuration for UI"""
        return {
            'period': {
                'type': 'slider',
                'min': 10,
                'max': 50,
                'default': 20,
                'step': 1,
                'label': 'Period'
            },
            'stddev': {
                'type': 'slider',
                'min': 1,
                'max': 3,
                'default': 2,
                'step': 0.1,
                'label': 'Standard Deviations'
            }
        }
