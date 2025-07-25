import pandas as pd
import numpy as np
from typing import Dict, Any
from .base_strategy import BaseStrategy
import warnings
warnings.filterwarnings('ignore')

class LSTMStrategy(BaseStrategy):
    """LSTM Neural Network prediction strategy"""
    
    def __init__(self, parameters: Dict[str, Any]):
        super().__init__(parameters)
        self.lookback_period = parameters.get('lookbackPeriod', 60)
        self.epochs = parameters.get('epochs', 50)
        self.units = parameters.get('units', 50)
        
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate signals based on LSTM predictions"""
        df = data.copy()
        
        # Simplified LSTM-like prediction using rolling statistics
        # In a real implementation, you would use TensorFlow/Keras
        
        # Calculate features for prediction
        df['Returns'] = df['close'].pct_change()
        df['MA_5'] = df['close'].rolling(window=5).mean()
        df['MA_20'] = df['close'].rolling(window=20).mean()
        df['Volatility'] = df['Returns'].rolling(window=self.lookback_period).std()
        
        # Simple prediction based on momentum and mean reversion
        df['Momentum'] = (df['close'] - df['close'].shift(self.lookback_period)) / df['close'].shift(self.lookback_period)
        df['MeanReversion'] = (df['close'] - df['MA_20']) / df['MA_20']
        
        # Generate prediction score
        df['PredictionScore'] = (df['Momentum'] * 0.6 + df['MeanReversion'] * -0.4)
        
        # Generate signals based on prediction
        df['signal'] = 0
        threshold = df['PredictionScore'].std() * 0.5
        
        df.loc[df['PredictionScore'] > threshold, 'signal'] = 1
        df.loc[df['PredictionScore'] < -threshold, 'signal'] = -1
        
        # Calculate positions
        df['position'] = df['signal'].replace(to_replace=0, method='ffill').fillna(0)
        
        return df[['close', 'PredictionScore', 'signal', 'position']]
    
    def get_parameter_config(self) -> Dict[str, Any]:
        """Return parameter configuration for UI"""
        return {
            'lookbackPeriod': {
                'type': 'slider',
                'min': 30,
                'max': 120,
                'default': 60,
                'step': 5,
                'label': 'Lookback Period'
            },
            'epochs': {
                'type': 'slider',
                'min': 10,
                'max': 100,
                'default': 50,
                'step': 10,
                'label': 'Training Epochs'
            },
            'units': {
                'type': 'slider',
                'min': 25,
                'max': 100,
                'default': 50,
                'step': 25,
                'label': 'LSTM Units'
            }
        }
