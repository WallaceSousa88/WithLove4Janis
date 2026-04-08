import { Router } from "express";
import { getDb } from "../db";

const router = Router();

router.get("/", (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT d.*, p.nome as origem_nome, c.nome as categoria_nome 
    FROM despesas d
    LEFT JOIN pessoas p ON d.origem_id = p.id
    LEFT JOIN categorias c ON d.categoria_id = c.id
  `).all();
  res.json(data);
});

router.post("/", (req, res) => {
  const db = getDb();
  const { data_compra, data_pagamento, valor, descricao, origem_id, destino, categoria_id, ignoreDuplicates } = req.body;
  
  if (!data_compra || !data_pagamento || isNaN(Number(valor)) || !origem_id || !categoria_id) {
    return res.status(400).json({ error: "Dados incompletos ou inválidos (valor, origem ou categoria)." });
  }

  const roundedValor = Math.round(Number(valor) * 100) / 100;
  
  if (!ignoreDuplicates) {
    const existing = db.prepare(`
      SELECT id FROM despesas 
      WHERE data_compra = ? AND data_pagamento = ? AND valor = ? AND descricao = ? AND origem_id = ? AND destino = ? AND categoria_id = ?
    `).get(data_compra, data_pagamento, roundedValor, descricao || '', origem_id, destino, categoria_id);

    if (existing) {
      return res.status(400).json({ error: "Esta despesa já foi lançada (duplicada)." });
    }
  }

  const result = db.prepare(
    "INSERT INTO despesas (data_compra, data_pagamento, valor, descricao, origem_id, destino, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(data_compra, data_pagamento, roundedValor, descricao || '', origem_id, destino, categoria_id);

  db.prepare(
    "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, pessoa_id, data_registro, destino, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(new Date().toISOString(), `Lançamento inicial: Saída S${result.lastInsertRowid} - ${descricao || 'Despesa'}`, 0, roundedValor, 'Despesa', result.lastInsertRowid, origem_id, data_pagamento, destino, categoria_id);

  res.json({ id: result.lastInsertRowid, data_compra, data_pagamento, valor: roundedValor, descricao, origem_id, destino, categoria_id });
});

router.patch("/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { valor, categoria_id } = req.body;

  try {
    const oldRecord = db.prepare("SELECT valor, descricao, origem_id, categoria_id FROM despesas WHERE id = ?").get(id) as any;
    if (!oldRecord) return res.status(404).json({ error: "Despesa não encontrada" });

    if (valor !== undefined) {
      if (isNaN(Number(valor))) {
        return res.status(400).json({ error: "Valor inválido." });
      }
      const roundedValor = Math.round(Number(valor) * 100) / 100;
      db.prepare("UPDATE despesas SET valor = ? WHERE id = ?").run(roundedValor, id);
      
      db.prepare(
        "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, pessoa_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(new Date().toISOString(), `Alteração de valor: Saída S${id} - ${oldRecord.descricao}`, oldRecord.valor, roundedValor, 'Despesa', id, oldRecord.origem_id);
    }

    if (categoria_id !== undefined) {
      db.prepare("UPDATE despesas SET categoria_id = ? WHERE id = ?").run(categoria_id, id);
      
      const oldCat = db.prepare("SELECT nome FROM categorias WHERE id = ?").get(oldRecord.categoria_id) as any;
      const newCat = db.prepare("SELECT nome FROM categorias WHERE id = ?").get(categoria_id) as any;
      
      db.prepare(
        "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, pessoa_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(new Date().toISOString(), `Alteração de categoria: Saída S${id} - ${oldRecord.descricao} (${oldCat?.nome || 'Sem Categoria'} -> ${newCat?.nome || 'Sem Categoria'})`, 0, 0, 'Despesa', id, oldRecord.origem_id);
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao atualizar despesa." });
  }
});

router.delete("/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  try {
    const oldRecord = db.prepare("SELECT valor, descricao, origem_id FROM despesas WHERE id = ?").get(id) as any;
    if (!oldRecord) return res.status(404).json({ error: "Despesa não encontrada" });

    db.prepare("DELETE FROM despesas WHERE id = ?").run(id);

    db.prepare(
      "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, pessoa_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(new Date().toISOString(), `Exclusão: Saída S${id} - ${oldRecord.descricao}`, oldRecord.valor, 0, 'Despesa', id, oldRecord.origem_id);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erro ao excluir despesa." });
  }
});

export default router;
