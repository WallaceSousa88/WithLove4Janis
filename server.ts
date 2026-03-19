import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database initialization
  const db = new Database("./database.sqlite");

  db.exec(`
    CREATE TABLE IF NOT EXISTS pessoas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS despesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      valor REAL NOT NULL,
      origem_id INTEGER NOT NULL,
      destino TEXT NOT NULL,
      categoria_id INTEGER NOT NULL,
      FOREIGN KEY(origem_id) REFERENCES pessoas(id),
      FOREIGN KEY(categoria_id) REFERENCES categorias(id)
    );

    CREATE TABLE IF NOT EXISTS salarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      valor REAL NOT NULL,
      recebedor_id INTEGER NOT NULL,
      FOREIGN KEY(recebedor_id) REFERENCES pessoas(id)
    );
  `);

  // API Routes
  app.get("/api/pessoas", (req, res) => {
    const data = db.prepare("SELECT * FROM pessoas").all();
    res.json(data);
  });

  app.post("/api/pessoas", (req, res) => {
    const { nome, cor } = req.body;
    const result = db.prepare("INSERT INTO pessoas (nome, cor) VALUES (?, ?)").run(nome, cor);
    res.json({ id: result.lastInsertRowid, nome, cor });
  });

  app.get("/api/categorias", (req, res) => {
    const data = db.prepare("SELECT * FROM categorias").all();
    res.json(data);
  });

  app.post("/api/categorias", (req, res) => {
    const { nome } = req.body;
    try {
      const result = db.prepare("INSERT INTO categorias (nome) VALUES (?)").run(nome);
      res.json({ id: result.lastInsertRowid, nome });
    } catch (e) {
      res.status(400).json({ error: "Categoria já existe" });
    }
  });

  app.get("/api/despesas", (req, res) => {
    const data = db.prepare(`
      SELECT d.*, p.nome as origem_nome, c.nome as categoria_nome 
      FROM despesas d
      JOIN pessoas p ON d.origem_id = p.id
      JOIN categorias c ON d.categoria_id = c.id
    `).all();
    res.json(data);
  });

  app.post("/api/despesas", (req, res) => {
    const { data, valor, origem_id, destino, categoria_id } = req.body;
    const result = db.prepare(
      "INSERT INTO despesas (data, valor, origem_id, destino, categoria_id) VALUES (?, ?, ?, ?, ?)"
    ).run(data, valor, origem_id, destino, categoria_id);
    res.json({ id: result.lastInsertRowid, data, valor, origem_id, destino, categoria_id });
  });

  app.get("/api/salarios", (req, res) => {
    const data = db.prepare(`
      SELECT s.*, p.nome as recebedor_nome 
      FROM salarios s
      JOIN pessoas p ON s.recebedor_id = p.id
    `).all();
    res.json(data);
  });

  app.post("/api/salarios", (req, res) => {
    const { data, valor, recebedor_id } = req.body;
    const result = db.prepare(
      "INSERT INTO salarios (data, valor, recebedor_id) VALUES (?, ?, ?)"
    ).run(data, valor, recebedor_id);
    res.json({ id: result.lastInsertRowid, data, valor, recebedor_id });
  });

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
