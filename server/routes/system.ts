import { Router } from "express";
import AdmZip from "adm-zip";
import multer from "multer";
import fs from "fs";
import { getDb, getDbPath, resetDbConnection, initDb, normalizeDates } from "../db";
import Database from "better-sqlite3";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.get("/backup", (req, res) => {
  try {
    const zip = new AdmZip();
    zip.addLocalFile(getDbPath());
    const buffer = zip.toBuffer();
    
    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", `attachment; filename=cashtrack_backup_${new Date().toISOString().split('T')[0]}.zip`);
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: "Erro ao gerar backup" });
  }
});

router.post("/restore", upload.single("backup"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  try {
    const filePath = req.file.path;
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    
    const dbEntry = zipEntries.find((entry: any) => entry.entryName === "database.sqlite");
    
    if (!dbEntry) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Arquivo de backup inválido (database.sqlite não encontrado)" });
    }

    const { close } = getDb();
    zip.extractEntryTo(dbEntry, ".", false, true);
    
    const newDb = new Database(getDbPath());
    initDb(newDb);
    normalizeDates(newDb);
    resetDbConnection(newDb);

    fs.unlinkSync(filePath);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao restaurar backup" });
  }
});

router.post("/reset", (req, res) => {
  try {
    const db = getDb();
    db.exec(`
      DELETE FROM despesas;
      DELETE FROM salarios;
      DELETE FROM pessoas;
      DELETE FROM categorias;
      DELETE FROM logs;
      DELETE FROM sqlite_sequence WHERE name IN ('despesas', 'salarios', 'pessoas', 'categorias', 'logs');
    `);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao resetar dados" });
  }
});

export default router;
