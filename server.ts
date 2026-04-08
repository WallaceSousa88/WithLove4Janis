import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

// Initialize database
import { getDb } from "./server/db";
getDb();

import pessoasRouter from "./server/routes/pessoas";
import categoriasRouter from "./server/routes/categorias";
import despesasRouter from "./server/routes/despesas";
import salariosRouter from "./server/routes/salarios";
import logsRouter from "./server/routes/logs";
import systemRouter from "./server/routes/system";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const apiRouter = express.Router();

  // Middleware for all API routes
  apiRouter.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Mount routers
  apiRouter.use("/", systemRouter);
  apiRouter.use("/pessoas", pessoasRouter);
  apiRouter.use("/categorias", categoriasRouter);
  apiRouter.use("/despesas", despesasRouter);
  apiRouter.use("/salarios", salariosRouter);
  apiRouter.use("/logs", logsRouter);

  app.use("/api", apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
