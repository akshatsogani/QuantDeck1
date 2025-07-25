from typing import Dict, Any, List
import importlib
import logging
from .base_strategy import BaseStrategy

logger = logging.getLogger(__name__)

class StrategyService:
    """Service for managing trading strategies"""
    
    def __init__(self):
        self.strategies = {}
        self._load_strategies()
    
    def _load_strategies(self):
        """Load all available strategies"""
        strategy_classes = {
            'moving_average': 'MovingAverageStrategy',
            'bollinger_bands': 'BollingerBandsStrategy', 
            'rsi': 'RSIStrategy',
            'macd': 'MACDStrategy',
            'lstm_model': 'LSTMStrategy'
        }
        
        for strategy_name, class_name in strategy_classes.items():
            try:
                module = importlib.import_module(f'strategies.{strategy_name}')
                strategy_class = getattr(module, class_name)
                self.strategies[strategy_name] = strategy_class
                logger.info(f"Loaded strategy: {strategy_name}")
            except Exception as e:
                logger.error(f"Failed to load strategy {strategy_name}: {str(e)}")
    
    def get_available_strategies(self) -> List[Dict[str, Any]]:
        """Get list of available strategies with metadata"""
        strategies = []
        
        for name, strategy_class in self.strategies.items():
            # Create temporary instance to get metadata
            temp_instance = strategy_class({})
            strategies.append({
                'id': name,
                'name': strategy_class.__name__.replace('Strategy', ''),
                'type': 'technical' if name != 'lstm_model' else 'ml',
                'description': strategy_class.__doc__ or 'No description available',
                'parameters': temp_instance.get_parameter_config()
            })
        
        return strategies
    
    def create_strategy_instance(self, strategy_name: str, parameters: Dict[str, Any]) -> BaseStrategy:
        """Create an instance of the specified strategy"""
        if strategy_name not in self.strategies:
            raise ValueError(f"Strategy '{strategy_name}' not found")
        
        strategy_class = self.strategies[strategy_name]
        return strategy_class(parameters)
    
    def validate_parameters(self, strategy_name: str, parameters: Dict[str, Any]) -> bool:
        """Validate strategy parameters"""
        if strategy_name not in self.strategies:
            return False
        
        try:
            # Create temporary instance to validate parameters
            strategy_class = self.strategies[strategy_name]
            strategy_class(parameters)
            return True
        except Exception as e:
            logger.error(f"Parameter validation failed for {strategy_name}: {str(e)}")
            return False
