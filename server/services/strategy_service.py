from typing import Dict, Any, List
import importlib
import logging
import os
from .base_strategy import BaseStrategy

logger = logging.getLogger(__name__)

class StrategyService:
    """Service for managing trading strategies"""
    
    def __init__(self):
        self.strategies = {}
        self.attached_models = {}
        self._load_strategies()
        self._load_attached_models()
    
    def _load_strategies(self):
        """Load all available strategies"""
        strategy_classes = {
            'moving_average': 'MovingAverageStrategy',
            'bollinger_bands': 'BollingerBandsStrategy', 
            'rsi': 'RSIStrategy',
            'macd': 'MACDStrategy',
            'lstm_model': 'LSTMStrategy',
            'comprehensive_backtest': 'ComprehensiveBacktestStrategy'
        }
        
        for strategy_name, class_name in strategy_classes.items():
            try:
                module = importlib.import_module(f'strategies.{strategy_name}')
                strategy_class = getattr(module, class_name)
                self.strategies[strategy_name] = strategy_class
                logger.info(f"Loaded strategy: {strategy_name}")
            except Exception as e:
                logger.error(f"Failed to load strategy {strategy_name}: {str(e)}")
    
    def _load_attached_models(self):
        """Load prebuilt models from attached_assets folder"""
        attached_assets_path = os.path.join(os.path.dirname(__file__), "../../attached_assets")
        
        if os.path.exists(attached_assets_path):
            for filename in os.listdir(attached_assets_path):
                if filename.endswith('.py') and filename != '__init__.py':
                    model_name = filename.replace('.py', '')
                    model_path = os.path.join(attached_assets_path, filename)
                    
                    # Create strategy metadata for attached models
                    self.attached_models[model_name] = {
                        'path': model_path,
                        'name': model_name.replace('_', ' ').title(),
                        'type': 'prebuilt',
                        'description': f'Prebuilt model: {model_name}'
                    }
                    logger.info(f"Found attached model: {model_name}")
    
    def get_available_strategies(self) -> List[Dict[str, Any]]:
        """Get list of available strategies with metadata"""
        strategies = []
        
        # Add regular strategies
        for name, strategy_class in self.strategies.items():
            try:
                # Create temporary instance to get metadata
                temp_instance = strategy_class({})
                strategies.append({
                    'id': name,
                    'name': strategy_class.__name__.replace('Strategy', ''),
                    'type': 'technical' if name != 'lstm_model' else 'ml',
                    'description': strategy_class.__doc__ or 'No description available',
                    'parameters': temp_instance.get_parameter_config(),
                    'category': 'built-in'
                })
            except Exception as e:
                logger.error(f"Error getting metadata for {name}: {str(e)}")
        
        # Add attached models
        for model_name, model_info in self.attached_models.items():
            strategies.append({
                'id': model_name,
                'name': model_info['name'],
                'type': model_info['type'],
                'description': model_info['description'],
                'parameters': self._get_default_parameters(),
                'category': 'prebuilt'
            })
        
        return strategies
    
    def _get_default_parameters(self) -> Dict[str, Any]:
        """Get default parameters for attached models"""
        return {
            'period': {'type': 'int', 'default': 20, 'min': 5, 'max': 50},
            'threshold': {'type': 'float', 'default': 0.02, 'min': 0.01, 'max': 0.1}
        }
    
    def create_strategy_instance(self, strategy_name: str, parameters: Dict[str, Any]) -> BaseStrategy:
        """Create an instance of the specified strategy"""
        if strategy_name not in self.strategies:
            # Check if it's an attached model
            if strategy_name in self.attached_models:
                # For attached models, create a wrapper strategy
                return self._create_attached_model_wrapper(strategy_name, parameters)
            else:
                raise ValueError(f"Strategy '{strategy_name}' not found")
        
        strategy_class = self.strategies[strategy_name]
        return strategy_class(parameters)
    
    def _create_attached_model_wrapper(self, model_name: str, parameters: Dict[str, Any]) -> BaseStrategy:
        """Create a wrapper for attached models"""
        class AttachedModelWrapper(BaseStrategy):
            def __init__(self, params):
                super().__init__(params)
                self.model_name = model_name
                self.model_path = self.attached_models[model_name]['path']
            
            def generate_signals(self, df):
                # This will be handled by the BacktestService
                # Return the dataframe with basic signal structure
                df['signal'] = 0
                df['position'] = 0
                return df
            
            def get_parameter_config(self):
                return self._get_default_parameters()
        
        # Make attached_models available to the wrapper
        AttachedModelWrapper.attached_models = self.attached_models
        AttachedModelWrapper._get_default_parameters = self._get_default_parameters
        
        return AttachedModelWrapper(parameters)
    
    def validate_parameters(self, strategy_name: str, parameters: Dict[str, Any]) -> bool:
        """Validate strategy parameters"""
        if strategy_name not in self.strategies and strategy_name not in self.attached_models:
            return False
        
        try:
            # For attached models, basic validation
            if strategy_name in self.attached_models:
                return True
            
            # Create temporary instance to validate parameters
            strategy_class = self.strategies[strategy_name]
            strategy_class(parameters)
            return True
        except Exception as e:
            logger.error(f"Parameter validation failed for {strategy_name}: {str(e)}")
            return False
    
    def get_strategy_info(self, strategy_name: str) -> Dict[str, Any]:
        """Get detailed information about a specific strategy"""
        if strategy_name in self.strategies:
            strategy_class = self.strategies[strategy_name]
            temp_instance = strategy_class({})
            return {
                'name': strategy_class.__name__,
                'type': 'technical',
                'description': strategy_class.__doc__ or 'No description available',
                'parameters': temp_instance.get_parameter_config(),
                'category': 'built-in'
            }
        elif strategy_name in self.attached_models:
            return self.attached_models[strategy_name]
        else:
            raise ValueError(f"Strategy '{strategy_name}' not found")
