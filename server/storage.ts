import { type User, type InsertUser, type Strategy, type InsertStrategy, type Backtest, type InsertBacktest, type Trade, type InsertTrade, type MarketData, type InsertMarketData } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Strategy methods
  getStrategies(): Promise<Strategy[]>;
  getStrategy(id: string): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: string, strategy: Partial<Strategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: string): Promise<boolean>;

  // Backtest methods
  getBacktests(userId?: string): Promise<Backtest[]>;
  getBacktest(id: string): Promise<Backtest | undefined>;
  createBacktest(backtest: InsertBacktest): Promise<Backtest>;
  updateBacktest(id: string, backtest: Partial<Backtest>): Promise<Backtest | undefined>;
  deleteBacktest(id: string): Promise<boolean>;

  // Trade methods
  getTrades(backtestId: string): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;

  // Market data methods
  getMarketData(ticker: string, startDate?: Date, endDate?: Date): Promise<MarketData[]>;
  saveMarketData(data: InsertMarketData[]): Promise<MarketData[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private strategies: Map<string, Strategy>;
  private backtests: Map<string, Backtest>;
  private trades: Map<string, Trade>;
  private marketData: Map<string, MarketData>;

  constructor() {
    this.users = new Map();
    this.strategies = new Map();
    this.backtests = new Map();
    this.trades = new Map();
    this.marketData = new Map();
    this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies() {
    const defaultStrategies: Strategy[] = [
      {
        id: randomUUID(),
        name: "Moving Average",
        type: "technical",
        description: "SMA/EMA crossover strategy",
        parameters: { period: 20, type: "SMA" },
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Bollinger Bands",
        type: "technical",
        description: "Mean reversion strategy using Bollinger Bands",
        parameters: { period: 20, stddev: 2 },
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "RSI",
        type: "technical",
        description: "Momentum oscillator strategy",
        parameters: { period: 14, overbought: 70, oversold: 30 },
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "MACD",
        type: "technical",
        description: "Trend following strategy",
        parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "LSTM Neural Net",
        type: "ml",
        description: "Deep learning price prediction",
        parameters: { lookbackPeriod: 60, epochs: 50, units: 50 },
        isActive: true,
        createdAt: new Date(),
      },
    ];

    defaultStrategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Strategy methods
  async getStrategies(): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(s => s.isActive);
  }

  async getStrategy(id: string): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const id = randomUUID();
    const newStrategy: Strategy = { 
      ...strategy, 
      id, 
      createdAt: new Date() 
    };
    this.strategies.set(id, newStrategy);
    return newStrategy;
  }

  async updateStrategy(id: string, strategy: Partial<Strategy>): Promise<Strategy | undefined> {
    const existing = this.strategies.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...strategy };
    this.strategies.set(id, updated);
    return updated;
  }

  async deleteStrategy(id: string): Promise<boolean> {
    return this.strategies.delete(id);
  }

  // Backtest methods
  async getBacktests(userId?: string): Promise<Backtest[]> {
    const backtests = Array.from(this.backtests.values());
    if (userId) {
      return backtests.filter(b => b.userId === userId);
    }
    return backtests;
  }

  async getBacktest(id: string): Promise<Backtest | undefined> {
    return this.backtests.get(id);
  }

  async createBacktest(backtest: InsertBacktest): Promise<Backtest> {
    const id = randomUUID();
    const newBacktest: Backtest = {
      ...backtest,
      id,
      results: null,
      status: "pending",
      createdAt: new Date(),
    };
    this.backtests.set(id, newBacktest);
    return newBacktest;
  }

  async updateBacktest(id: string, backtest: Partial<Backtest>): Promise<Backtest | undefined> {
    const existing = this.backtests.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...backtest };
    this.backtests.set(id, updated);
    return updated;
  }

  async deleteBacktest(id: string): Promise<boolean> {
    return this.backtests.delete(id);
  }

  // Trade methods
  async getTrades(backtestId: string): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(t => t.backtestId === backtestId);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const id = randomUUID();
    const newTrade: Trade = { ...trade, id };
    this.trades.set(id, newTrade);
    return newTrade;
  }

  // Market data methods
  async getMarketData(ticker: string, startDate?: Date, endDate?: Date): Promise<MarketData[]> {
    const data = Array.from(this.marketData.values()).filter(d => d.ticker === ticker);
    
    if (startDate && endDate) {
      return data.filter(d => d.date >= startDate && d.date <= endDate);
    }
    
    return data;
  }

  async saveMarketData(data: InsertMarketData[]): Promise<MarketData[]> {
    const savedData: MarketData[] = [];
    
    data.forEach(item => {
      const id = randomUUID();
      const marketData: MarketData = { ...item, id };
      this.marketData.set(id, marketData);
      savedData.push(marketData);
    });
    
    return savedData;
  }
}

export const storage = new MemStorage();
