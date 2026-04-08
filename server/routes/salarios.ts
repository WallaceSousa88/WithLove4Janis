import { Router } from "express";
import { getDb } from "../db";

const router = Router();

router.get("/", (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT s.*, p.nome as recebedor_nome 
    FROM salarios s
    LEFT JOIN pessoas p ON s.recebedor_id = p.id
  `).all();
  res.json(data);
});

router.post("/", (req, res) => {
  const db = getDb();
  const { data_pagamento, valor, descricao, recebedor_id } = req.body;
  
  if (!data_pagamento || isNaN(Number(valor)) || !recebedor_id) {
    return res.status(400).json({ error: "Dados incompletos ou inválidos (valor ou recebedor)." });
  }

  const roundedValor = Math.round(Number(valor) * 100) / 100;

  const existing = db.prepare(`
    SELECT id FROM salarios 
    WHERE data_pagamento = ? AND valor = ? AND descricao = ? AND recebedor_id = ?
  `).get(data_pagamento, roundedValor, descricao || '', recebedor_id);

  if (existing) {
    return res.status(400).json({ error: "Este lançamento de entrada já existe (duplicado)." });
  }

  const result = db.prepare(
    "INSERT INTO salarios (data_pagamento, valor, descricao, recebedor_id) VALUES (?, ?, ?, ?)"
  ).run(data_pagamento, roundedValor, descricao || '', recebedor_id);

  db.prepare(
    "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, pessoa_id, data_registro, destino) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(new Date().toISOString(), `Lançamento inicial: Entrada E${result.lastInsertRowid} - ${descricao || 'Entrada'}`, 0, roundedValor, 'Entrada', result.lastInsertRowid, recebedor_id, data_pagamento, 'Entrada');

  res.json({ id: result.lastInsertRowid, data_pagamento, valor: roundedValor, descricao, recebedor_id });
});

router.patch("/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { valor } = req.body;

  if (isNaN(Number(valor))) {
    return res.status(400).json({ error: "Valor inválido." });
  }

  const roundedValor = Math.round(Number(valor) * 100) / 100;

  try {
    const oldRecord = db.prepare("SELECT valor, descricao, recebedor_id FROM salarios WHERE id = ?").get(id) as any;
    if (!oldRecord) return res.status(404).json({ error: "Entrada não encontrada" });

    db.prepare("UPDATE salarios SET valor = ? WHERE id = ?").run(roundedValor, id);

    db.prepare(
      "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, pessoa_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(new Date().toISOString(), `Alteração de valor: Entrada E${id} - ${oldRecord.descricao}`, oldRecord.valor, roundedValor, 'Entrada', id, oldRecord.recebedor_id);

    res.json({ success: true, valor: roundedValor });
  } catch (e) {
    res.status(500).json({ error: "Erro ao atualizar valor da entrada." });
  }
});

router.delete("/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  try {
    const oldRecord = db.prepare("SELECT valor, descricao, recebedor_id FROM salarios WHERE id = ?").get(id) as any;
    if (!oldRecord) return res.status(404).json({ error: "Entrada não encontrada" });

    db.prepare("DELETE FROM salarios WHERE id = ?").run(id);

    db.prepare(
      "INSERT INTO logs (timestamp, descricao, valor_antigo, valor_novo, tipo, registro_id, pessoa_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(new Date().toISOString(), `Exclusão: Entrada E${id} - ${oldRecord.descricao}`, oldRecord.valor, 0, 'Entrada', id, oldRecord.recebedor_id);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erro ao excluir entrada." });
  }
});

export default router;
