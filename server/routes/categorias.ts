import { Router } from "express";
import { getDb } from "../db";

const router = Router();

router.get("/", (req, res) => {
  const db = getDb();
  const data = db.prepare("SELECT * FROM categorias").all();
  res.json(data);
});

router.post("/", (req, res) => {
  const db = getDb();
  const { nome } = req.body;
  try {
    const result = db.prepare("INSERT INTO categorias (nome) VALUES (?)").run(nome);
    
    db.prepare(
      "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(new Date().toISOString(), `Nova Categoria: ${nome}`, 0, 0, 'Categoria', result.lastInsertRowid, result.lastInsertRowid);

    res.json({ id: result.lastInsertRowid, nome });
  } catch (e) {
    const existing = db.prepare("SELECT * FROM categorias WHERE nome = ?").get(nome) as any;
    if (existing) {
      return res.json(existing);
    }
    res.status(400).json({ error: "Erro ao criar categoria" });
  }
});

router.put("/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { nome } = req.body;
  try {
    const old = db.prepare("SELECT * FROM categorias WHERE id = ?").get(id) as any;
    db.prepare("UPDATE categorias SET nome = ? WHERE id = ?").run(nome, id);
    
    db.prepare(
      "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(new Date().toISOString(), `Categoria Alterada: ${old.nome} -> ${nome}`, 0, 0, 'Categoria', id, id);

    res.json({ id, nome });
  } catch (e) {
    res.status(400).json({ error: "Erro ao atualizar categoria" });
  }
});

router.delete("/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  try {
    const old = db.prepare("SELECT * FROM categorias WHERE id = ?").get(id) as any;
    
    const count = (db.prepare("SELECT COUNT(*) as count FROM despesas WHERE categoria_id = ?").get(id) as any).count;
    if (count > 0) {
      return res.status(400).json({ error: "Não é possível excluir uma categoria que possui despesas vinculadas" });
    }

    db.prepare("DELETE FROM categorias WHERE id = ?").run(id);
    
    db.prepare(
      "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(new Date().toISOString(), `Categoria Excluída: ${old.nome}`, 0, 0, 'Categoria', id, id);

    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Erro ao excluir categoria" });
  }
});

export default router;
