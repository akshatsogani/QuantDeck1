import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { spawn } from "child_process";
import path from "path";
import { insertBacktestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Strategy routes
  app.get("/api/strategies", async (req, res) => {
    try {
      const strategies = await storage.getStrategies();
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });

  app.get("/api/strategies/:id", async (req, res) => {
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

  // Market data routes
  app.get("/api/market-data/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const { start_date, end_date } = req.query;
      
      // Call Python service for data fetching
      const pythonScript = path.join(process.cwd(), "server/services/data_service.py");
      const python = spawn("python3", ["-c", `
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

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        error += data.toString();
      });

      python.on("close", (code) => {
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

  // Validate ticker
  app.get("/api/validate-ticker/:ticker", async (req, res) => {
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

  // Backtest routes
  app.post("/api/backtests", async (req, res) => {
    try {
      const validatedData = insertBacktestSchema.parse(req.body);
      const backtest = await storage.createBacktest(validatedData);
      res.json(backtest);
    } catch (error) {
      res.status(400).json({ error: "Invalid backtest configuration" });
    }
  });

  app.post("/api/backtests/:id/run", async (req, res) => {
    try {
      const { id } = req.params;
      const backtest = await storage.getBacktest(id);
      
      if (!backtest) {
        return res.status(404).json({ error: "Backtest not found" });
      }

      // Update status to running
      await storage.updateBacktest(id, { status: "running" });

      // Run backtest in Python
      const pythonScript = spawn("python3", ["-c", `
import sys
sys.path.append('${path.join(process.cwd(), "server/services")}')
from backtest_service import BacktestService
import json

config = {
    "ticker": "${backtest.ticker}",
    "start_date": "${backtest.startDate?.toISOString().split('T')[0]}",
    "end_date": "${backtest.endDate?.toISOString().split('T')[0]}",
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
          
          // Update backtest with results
          await storage.updateBacktest(id, { 
            status: "completed", 
            results: results 
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

  app.get("/api/backtests/:id", async (req, res) => {
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

  app.get("/api/backtests", async (req, res) => {
    try {
      const backtests = await storage.getBacktests();
      res.json(backtests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backtests" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
