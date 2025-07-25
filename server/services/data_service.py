import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class DataService:
    """Service for fetching and processing market data"""
    
    @staticmethod
    def fetch_stock_data(ticker: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """Fetch stock data from yfinance"""
        try:
            stock = yf.Ticker(ticker)
            data = stock.history(start=start_date, end=end_date)
            
            if data.empty:
                raise ValueError(f"No data found for ticker {ticker}")
            
            # Convert to the format expected by our application
            data_records = data.reset_index()
            # Convert datetime columns to strings for JSON serialization
            data_records['Date'] = data_records['Date'].dt.strftime('%Y-%m-%d')
            
            # Ensure all numeric values are JSON serializable
            for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
                if col in data_records.columns:
                    data_records[col] = data_records[col].astype(float)
            
            processed_data = {
                'ticker': ticker,
                'data': data_records.to_dict('records'),
                'metadata': {
                    'start_date': start_date,
                    'end_date': end_date,
                    'total_records': len(data),
                    'price_range': {
                        'min': float(data['Low'].min()),
                        'max': float(data['High'].max())
                    },
                    'avg_volume': float(data['Volume'].mean()),
                    'volatility': float(data['Close'].pct_change().std() * np.sqrt(252) * 100)
                }
            }
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Error fetching data for {ticker}: {str(e)}")
            raise
    
    @staticmethod
    def validate_ticker(ticker: str) -> bool:
        """Validate if ticker exists"""
        try:
            stock = yf.Ticker(ticker)
            # Try to get recent data to validate ticker
            data = stock.history(period="5d")
            return not data.empty
        except:
            return False
    
    @staticmethod
    def get_ticker_info(ticker: str) -> Dict[str, Any]:
        """Get ticker information"""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            return {
                'symbol': info.get('symbol', ticker),
                'name': info.get('longName', info.get('shortName', 'Unknown')),
                'sector': info.get('sector', 'Unknown'),
                'market_cap': info.get('marketCap', 0),
                'current_price': info.get('currentPrice', 0)
            }
        except Exception as e:
            logger.error(f"Error getting ticker info for {ticker}: {str(e)}")
            return {'symbol': ticker, 'name': 'Unknown', 'sector': 'Unknown'}
    
    @staticmethod
    def calculate_technical_indicators(data: pd.DataFrame) -> pd.DataFrame:
        """Calculate common technical indicators"""
        df = data.copy()
        
        # Simple Moving Averages
        for period in [20, 50, 200]:
            df[f'SMA_{period}'] = df['Close'].rolling(window=period).mean()
            df[f'EMA_{period}'] = df['Close'].ewm(span=period).mean()
        
        # Bollinger Bands
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
        df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)
        
        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD
        df['MACD'] = df['Close'].ewm(span=12).mean() - df['Close'].ewm(span=26).mean()
        df['MACD_Signal'] = df['MACD'].ewm(span=9).mean()
        df['MACD_Histogram'] = df['MACD'] - df['MACD_Signal']
        
        return df
    
    @staticmethod
    def prepare_data_for_strategy(data: List[Dict], strategy_type: str) -> pd.DataFrame:
        """Prepare data for strategy execution"""
        df = pd.DataFrame(data)
        
        # Ensure we have the required columns
        df['Date'] = pd.to_datetime(df['Date'])
        df.set_index('Date', inplace=True)
        
        # Rename columns to match strategy expectations
        column_mapping = {
            'Open': 'open',
            'High': 'high', 
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        }
        df.rename(columns=column_mapping, inplace=True)
        
        # Calculate technical indicators if needed
        if strategy_type in ['technical', 'hybrid']:
            df = DataService.calculate_technical_indicators(df)
        
        return df
