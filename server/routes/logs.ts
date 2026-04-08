import { Router } from "express";
import { getDb } from "../db";

const router = Router();

router.get("/", (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT l.*, p.nome as pessoa_nome, c.nome as categoria_nome 
    FROM logs l
    LEFT JOIN pessoas p ON l.pessoa_id = p.id
    LEFT JOIN categorias c ON l.categoria_id = c.id
    ORDER BY l.timestamp DESC
  `).all();
  res.json(data);
});

export default router;
