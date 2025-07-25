// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  strategies;
  backtests;
  trades;
  marketData;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.strategies = /* @__PURE__ */ new Map();
    this.backtests = /* @__PURE__ */ new Map();
    this.trades = /* @__PURE__ */ new Map();
    this.marketData = /* @__PURE__ */ new Map();
    this.initializeDefaultStrategies();
  }
  initializeDefaultStrategies() {
    const defaultStrategies = [
      {
        id: randomUUID(),
        name: "Moving Average",
        type: "technical",
        description: "SMA/EMA crossover strategy",
        parameters: { period: 20, type: "SMA" },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: randomUUID(),
        name: "Bollinger Bands",
        type: "technical",
        description: "Mean reversion strategy using Bollinger Bands",
        parameters: { period: 20, stddev: 2 },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: randomUUID(),
        name: "RSI",
        type: "technical",
        description: "Momentum oscillator strategy",
        parameters: { period: 14, overbought: 70, oversold: 30 },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: randomUUID(),
        name: "MACD",
        type: "technical",
        description: "Trend following strategy",
        parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: randomUUID(),
        name: "LSTM Neural Net",
        type: "ml",
        description: "Deep learning price prediction",
        parameters: { lookbackPeriod: 60, epochs: 50, units: 50 },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      }
    ];
    defaultStrategies.forEach((strategy) => {
      this.strategies.set(strategy.id, strategy);
    });
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  // Strategy methods
  async getStrategies() {
    return Array.from(this.strategies.values()).filter((s) => s.isActive);
  }
  async getStrategy(id) {
    return this.strategies.get(id);
  }
  async createStrategy(strategy) {
    const id = randomUUID();
    const newStrategy = {
      ...strategy,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.strategies.set(id, newStrategy);
    return newStrategy;
  }
  async updateStrategy(id, strategy) {
    const existing = this.strategies.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...strategy };
    this.strategies.set(id, updated);
    return updated;
  }
  async deleteStrategy(id) {
    return this.strategies.delete(id);
  }
  // Backtest methods
  async getBacktests(userId) {
    const backtests2 = Array.from(this.backtests.values());
    if (userId) {
      return backtests2.filter((b) => b.userId === userId);
    }
    return backtests2;
  }
  async getBacktest(id) {
    return this.backtests.get(id);
  }
  async createBacktest(backtest) {
    const id = randomUUID();
    const newBacktest = {
      ...backtest,
      id,
      results: null,
      status: "pending",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.backtests.set(id, newBacktest);
    return newBacktest;
  }
  async updateBacktest(id, backtest) {
    const existing = this.backtests.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...backtest };
    this.backtests.set(id, updated);
    return updated;
  }
  async deleteBacktest(id) {
    return this.backtests.delete(id);
  }
  // Trade methods
  async getTrades(backtestId) {
    return Array.from(this.trades.values()).filter((t) => t.backtestId === backtestId);
  }
  async createTrade(trade) {
    const id = randomUUID();
    const newTrade = { ...trade, id };
    this.trades.set(id, newTrade);
    return newTrade;
  }
  // Market data methods
  async getMarketData(ticker, startDate, endDate) {
    const data = Array.from(this.marketData.values()).filter((d) => d.ticker === ticker);
    if (startDate && endDate) {
      return data.filter((d) => d.date >= startDate && d.date <= endDate);
    }
    return data;
  }
  async saveMarketData(data) {
    const savedData = [];
    data.forEach((item) => {
      const id = randomUUID();
      const marketData2 = { ...item, id };
      this.marketData.set(id, marketData2);
      savedData.push(marketData2);
    });
    return savedData;
  }
};
var storage = new MemStorage();

// server/routes.ts
import { spawn } from "child_process";
import path from "path";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // 'technical', 'ml', 'custom'
  description: text("description"),
  parameters: jsonb("parameters").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var backtests = pgTable("backtests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  ticker: text("ticker").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  initialCapital: real("initial_capital").notNull(),
  commission: real("commission").default(1e-3),
  strategyConfig: jsonb("strategy_config").notNull(),
  results: jsonb("results"),
  status: text("status").default("pending"),
  // 'pending', 'running', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow()
});
var trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  backtestId: varchar("backtest_id").references(() => backtests.id),
  entryDate: timestamp("entry_date").notNull(),
  exitDate: timestamp("exit_date"),
  side: text("side").notNull(),
  // 'long', 'short'
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  quantity: integer("quantity").notNull(),
  pnl: real("pnl"),
  returnPct: real("return_pct")
});
var marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticker: text("ticker").notNull(),
  date: timestamp("date").notNull(),
  open: real("open").notNull(),
  high: real("high").notNull(),
  low: real("low").notNull(),
  close: real("close").notNull(),
  volume: integer("volume").notNull(),
  adjClose: real("adj_close").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertStrategySchema = createInsertSchema(strategies).pick({
  name: true,
  type: true,
  description: true,
  parameters: true,
  isActive: true
});
var insertBacktestSchema = createInsertSchema(backtests).pick({
  ticker: true,
  startDate: true,
  endDate: true,
  initialCapital: true,
  commission: true,
  strategyConfig: true
});
var insertTradeSchema = createInsertSchema(trades).pick({
  backtestId: true,
  entryDate: true,
  exitDate: true,
  side: true,
  entryPrice: true,
  exitPrice: true,
  quantity: true,
  pnl: true,
  returnPct: true
});
var insertMarketDataSchema = createInsertSchema(marketData).pick({
  ticker: true,
  date: true,
  open: true,
  high: true,
  low: true,
  close: true,
  volume: true,
  adjClose: true
});

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/strategies", async (req, res) => {
    try {
      const strategies2 = await storage.getStrategies();
      res.json(strategies2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });
  app2.get("/api/strategies/:id", async (req, res) => {
    try {
      const strategy = await storage.getStrategy(req.params.id);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch strategy" });
    }
  });
  app2.get("/api/market-data/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const { start_date, end_date } = req.query;
      const pythonScript = path.join(process.cwd(), "server/services/data_service.py");
      const python2 = spawn("python3", ["-c", `
import sys
import os
sys.path.append('${path.join(process.cwd(), "server/services")}')
os.chdir('${path.join(process.cwd(), "server/services")}')
from data_service import DataService
import json

try:
    data = DataService.fetch_stock_data('${ticker}', '${start_date}', '${end_date}')
    print(json.dumps(data))
except Exception as e:
    import traceback
    print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))
      `]);
      let output = "";
      let error = "";
      python2.stdout.on("data", (data) => {
        output += data.toString();
      });
      python2.stderr.on("data", (data) => {
        error += data.toString();
      });
      python2.on("close", (code) => {
        if (code !== 0) {
          return res.status(500).json({ error: error || "Python script failed" });
        }
        try {
          const result = JSON.parse(output);
          if (result.error) {
            return res.status(400).json({ error: result.error });
          }
          res.json(result);
        } catch (parseError) {
          res.status(500).json({ error: "Failed to parse response" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });
  app2.get("/api/validate-ticker/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const pythonScript = spawn("python3", ["-c", `
import sys
import os
sys.path.append('${path.join(process.cwd(), "server/services")}')
os.chdir('${path.join(process.cwd(), "server/services")}')
from data_service import DataService
import json

try:
    is_valid = DataService.validate_ticker('${ticker}')
    info = DataService.get_ticker_info('${ticker}') if is_valid else {}
    print(json.dumps({"valid": is_valid, "info": info}))
except Exception as e:
    import traceback
    print(json.dumps({"valid": False, "error": str(e), "traceback": traceback.format_exc()}))
      `]);
      let output = "";
      let error = "";
      pythonScript.stdout.on("data", (data) => {
        output += data.toString();
      });
      pythonScript.stderr.on("data", (data) => {
        error += data.toString();
      });
      pythonScript.on("close", (code) => {
        if (code !== 0) {
          return res.status(500).json({ valid: false, error: error || "Python script failed" });
        }
        try {
          const result = JSON.parse(output);
          res.json(result);
        } catch (parseError) {
          res.json({ valid: false, error: "Failed to validate ticker" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate ticker" });
    }
  });
  app2.post("/api/backtests", async (req, res) => {
    try {
      const validatedData = insertBacktestSchema.parse(req.body);
      const backtest = await storage.createBacktest(validatedData);
      res.json(backtest);
    } catch (error) {
      res.status(400).json({ error: "Invalid backtest configuration" });
    }
  });
  app2.post("/api/backtests/:id/run", async (req, res) => {
    try {
      const { id } = req.params;
      const backtest = await storage.getBacktest(id);
      if (!backtest) {
        return res.status(404).json({ error: "Backtest not found" });
      }
      await storage.updateBacktest(id, { status: "running" });
      const pythonScript = spawn("python3", ["-c", `
import sys
sys.path.append('${path.join(process.cwd(), "server/services")}')
from backtest_service import BacktestService
import json

config = {
    "ticker": "${backtest.ticker}",
    "start_date": "${backtest.startDate?.toISOString().split("T")[0]}",
    "end_date": "${backtest.endDate?.toISOString().split("T")[0]}",
    "initial_capital": ${backtest.initialCapital},
    "commission": ${backtest.commission},
    "strategy_config": ${JSON.stringify(backtest.strategyConfig).replace(/"/g, '\\"')}
}

try:
    service = BacktestService()
    results = service.run_backtest(config)
    print(json.dumps(results))
except Exception as e:
    print(json.dumps({"error": str(e)}))
      `]);
      let output = "";
      let error = "";
      python.stdout.on("data", (data) => {
        output += data.toString();
      });
      python.stderr.on("data", (data) => {
        error += data.toString();
      });
      python.on("close", async (code) => {
        try {
          if (code !== 0) {
            await storage.updateBacktest(id, { status: "failed" });
            return res.status(500).json({ error: error || "Backtest failed" });
          }
          const results = JSON.parse(output);
          if (results.error) {
            await storage.updateBacktest(id, { status: "failed" });
            return res.status(400).json({ error: results.error });
          }
          await storage.updateBacktest(id, {
            status: "completed",
            results
          });
          res.json(results);
        } catch (parseError) {
          await storage.updateBacktest(id, { status: "failed" });
          res.status(500).json({ error: "Failed to parse backtest results" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to run backtest" });
    }
  });
  app2.get("/api/backtests/:id", async (req, res) => {
    try {
      const backtest = await storage.getBacktest(req.params.id);
      if (!backtest) {
        return res.status(404).json({ error: "Backtest not found" });
      }
      res.json(backtest);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backtest" });
    }
  });
  app2.get("/api/backtests", async (req, res) => {
    try {
      const backtests2 = await storage.getBacktests();
      res.json(backtests2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backtests" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
async function loadReplitPlugins() {
  const plugins = [];
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0) {
    try {
      const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
      plugins.push(runtimeErrorOverlay.default());
    } catch (e) {
      console.warn("Failed to load @replit/vite-plugin-runtime-error-modal:", e.message);
    }
    try {
      const cartographer = await import("@replit/vite-plugin-cartographer");
      plugins.push(cartographer.cartographer());
    } catch (e) {
      console.warn("Failed to load @replit/vite-plugin-cartographer:", e.message);
    }
  }
  return plugins;
}
var vite_config_default = defineConfig(async () => ({
  plugins: [
    react(),
    ...await loadReplitPlugins()
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
}));

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "80", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
