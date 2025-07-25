from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

class BaseStrategy(ABC):
    """Base class for all trading strategies"""
    
    def __init__(self, parameters: Dict[str, Any]):
        self.parameters = parameters
        self.signals = pd.DataFrame()
        
    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate buy/sell signals based on the strategy"""
        pass
    
    @abstractmethod
    def get_parameter_config(self) -> Dict[str, Any]:
        """Return parameter configuration for UI"""
        pass
    
    def validate_data(self, data: pd.DataFrame) -> bool:
        """Validate input data"""
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        return all(col in data.columns for col in required_columns)
    
    def calculate_positions(self, signals: pd.DataFrame) -> pd.DataFrame:
        """Calculate position sizes based on signals"""
        positions = signals.copy()
        positions['position'] = 0
        
        for i in range(len(signals)):
            if signals.iloc[i]['signal'] == 1:  # Buy signal
                positions.iloc[i]['position'] = 1
            elif signals.iloc[i]['signal'] == -1:  # Sell signal
                positions.iloc[i]['position'] = -1
                
        return positions
    
    def get_strategy_info(self) -> Dict[str, Any]:
        """Return strategy metadata"""
        return {
            'name': self.__class__.__name__,
            'parameters': self.parameters,
            'description': self.__doc__ or 'No description available'
        }
