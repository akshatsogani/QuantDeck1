import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'technical', 'ml', 'custom'
  description: text("description"),
  parameters: jsonb("parameters").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const backtests = pgTable("backtests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  ticker: text("ticker").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  initialCapital: real("initial_capital").notNull(),
  commission: real("commission").default(0.001),
  strategyConfig: jsonb("strategy_config").notNull(),
  results: jsonb("results"),
  status: text("status").default("pending"), // 'pending', 'running', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  backtestId: varchar("backtest_id").references(() => backtests.id),
  entryDate: timestamp("entry_date").notNull(),
  exitDate: timestamp("exit_date"),
  side: text("side").notNull(), // 'long', 'short'
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  quantity: integer("quantity").notNull(),
  pnl: real("pnl"),
  returnPct: real("return_pct"),
});

export const marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticker: text("ticker").notNull(),
  date: timestamp("date").notNull(),
  open: real("open").notNull(),
  high: real("high").notNull(),
  low: real("low").notNull(),
  close: real("close").notNull(),
  volume: integer("volume").notNull(),
  adjClose: real("adj_close").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStrategySchema = createInsertSchema(strategies).pick({
  name: true,
  type: true,
  description: true,
  parameters: true,
  isActive: true,
});

export const insertBacktestSchema = createInsertSchema(backtests).pick({
  ticker: true,
  startDate: true,
  endDate: true,
  initialCapital: true,
  commission: true,
  strategyConfig: true,
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  backtestId: true,
  entryDate: true,
  exitDate: true,
  side: true,
  entryPrice: true,
  exitPrice: true,
  quantity: true,
  pnl: true,
  returnPct: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).pick({
  ticker: true,
  date: true,
  open: true,
  high: true,
  low: true,
  close: true,
  volume: true,
  adjClose: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;

export type Backtest = typeof backtests.$inferSelect;
export type InsertBacktest = z.infer<typeof insertBacktestSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
