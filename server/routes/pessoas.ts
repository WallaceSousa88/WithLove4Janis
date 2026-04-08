import { Router } from "express";
import { getDb } from "../db";

const router = Router();

router.get("/", (req, res) => {
  const db = getDb();
  const data = db.prepare("SELECT * FROM pessoas").all();
  res.json(data);
});

router.post("/", (req, res) => {
  const db = getDb();
  const { nome, cor } = req.body;
  const result = db.prepare("INSERT INTO pessoas (nome, cor) VALUES (?, ?)").run(nome, cor);
  
  db.prepare(
    "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, pessoa_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(new Date().toISOString(), `Nova Pessoa: ${nome}`, 0, 0, 'Pessoa', result.lastInsertRowid, result.lastInsertRowid);

  res.json({ id: result.lastInsertRowid, nome, cor });
});

router.delete("/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  const deleteTransaction = db.transaction(() => {
    db.prepare("DELETE FROM despesas WHERE origem_id = ?").run(id);
    db.prepare("DELETE FROM salarios WHERE recebedor_id = ?").run(id);
    db.prepare("DELETE FROM pessoas WHERE id = ?").run(id);
  });

  try {
    deleteTransaction();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erro ao excluir pessoa e seus dados." });
  }
});

export default router;
