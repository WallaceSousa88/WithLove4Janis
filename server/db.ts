import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "database.sqlite");

export const getDbPath = () => DB_PATH;

export const initDb = (database: Database.Database) => {
  database.exec(`
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
      data_compra TEXT NOT NULL,
      data_pagamento TEXT NOT NULL,
      valor REAL NOT NULL,
      descricao TEXT DEFAULT '',
      origem_id INTEGER NOT NULL,
      destino TEXT NOT NULL,
      categoria_id INTEGER NOT NULL,
      FOREIGN KEY(origem_id) REFERENCES pessoas(id),
      FOREIGN KEY(categoria_id) REFERENCES categorias(id)
    );

    CREATE TABLE IF NOT EXISTS salarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_pagamento TEXT NOT NULL,
      valor REAL NOT NULL,
      descricao TEXT DEFAULT '',
      recebedor_id INTEGER NOT NULL,
      FOREIGN KEY(recebedor_id) REFERENCES pessoas(id)
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      descricao TEXT NOT NULL,
      valor_antigo REAL,
      valor_novo REAL,
      tipo TEXT NOT NULL,
      registro_id INTEGER NOT NULL,
      pessoa_id INTEGER,
      data_registro TEXT,
      destino TEXT,
      categoria_id INTEGER
    );
  `);

  // Ensure columns exist for existing databases
  try { database.exec("ALTER TABLE despesas ADD COLUMN data_compra TEXT"); } catch (e) {}
  try { database.exec("ALTER TABLE despesas ADD COLUMN data_pagamento TEXT"); } catch (e) {}
  try { database.exec("ALTER TABLE salarios ADD COLUMN data_pagamento TEXT"); } catch (e) {}
  
  // Migration for old 'data' column
  try {
    database.exec(`
      UPDATE despesas SET data_compra = data, data_pagamento = data WHERE data_compra IS NULL;
      UPDATE salarios SET data_pagamento = data WHERE data_pagamento IS NULL;
    `);
  } catch (e) {}

  try { database.exec("ALTER TABLE despesas ADD COLUMN descricao TEXT DEFAULT ''"); } catch (e) {}
  try { database.exec("ALTER TABLE salarios ADD COLUMN descricao TEXT DEFAULT ''"); } catch (e) {}
  try { database.exec("ALTER TABLE logs ADD COLUMN data_registro TEXT"); } catch (e) {}
  try { database.exec("ALTER TABLE logs ADD COLUMN destino TEXT"); } catch (e) {}
  try { database.exec("ALTER TABLE logs ADD COLUMN categoria_id INTEGER"); } catch (e) {}
};

export const normalizeDates = (database: Database.Database) => {
  const tables = [
    { name: 'despesas', cols: ['data_compra', 'data_pagamento'] },
    { name: 'salarios', cols: ['data_pagamento'] }
  ];
  
  for (const table of tables) {
    for (const col of table.cols) {
      const records = database.prepare(`SELECT id, ${col} FROM ${table.name} WHERE ${col} IS NOT NULL`).all();
      for (const r of records as any[]) {
        const val = r[col];
        if (val && val.includes('/')) {
          const parts = val.split('/');
          if (parts.length === 3) {
            const [d, m, y] = parts;
            const normalized = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            database.prepare(`UPDATE ${table.name} SET ${col} = ? WHERE id = ?`).run(normalized, r.id);
          }
        }
      }
    }
  }
};

export const seedData = (database: Database.Database) => {
  const pessoasCount = database.prepare("SELECT COUNT(*) as count FROM pessoas").get() as any;
  if (pessoasCount.count === 0) {
    console.log("Seeding example data...");
    
    // Insert Pessoas
    const p1 = database.prepare("INSERT INTO pessoas (nome, cor) VALUES (?, ?)").run("Wallace", "#4f46e5");
    const p2 = database.prepare("INSERT INTO pessoas (nome, cor) VALUES (?, ?)").run("Janis", "#ec4899");
    
    // Insert Categorias
    const c1 = database.prepare("INSERT INTO categorias (nome) VALUES (?)").run("Alimentação");
    const c2 = database.prepare("INSERT INTO categorias (nome) VALUES (?)").run("Lazer");
    const c3 = database.prepare("INSERT INTO categorias (nome) VALUES (?)").run("Transporte");
    const c4 = database.prepare("INSERT INTO categorias (nome) VALUES (?)").run("Aluguel");
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Insert Salarios (Entradas)
    database.prepare("INSERT INTO salarios (data_pagamento, valor, descricao, recebedor_id) VALUES (?, ?, ?, ?)").run(yesterday, 5000, "Salário Mensal", p1.lastInsertRowid);
    database.prepare("INSERT INTO salarios (data_pagamento, valor, descricao, recebedor_id) VALUES (?, ?, ?, ?)").run(yesterday, 4500, "Salário Mensal", p2.lastInsertRowid);
    
    // Insert Despesas (Saídas)
    database.prepare("INSERT INTO despesas (data_compra, data_pagamento, valor, descricao, origem_id, destino, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(today, today, 150, "Jantar", p1.lastInsertRowid, "Dividir", c1.lastInsertRowid);
    database.prepare("INSERT INTO despesas (data_compra, data_pagamento, valor, descricao, origem_id, destino, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(today, today, 80, "Cinema", p2.lastInsertRowid, "Dividir", c2.lastInsertRowid);
    database.prepare("INSERT INTO despesas (data_compra, data_pagamento, valor, descricao, origem_id, destino, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(yesterday, yesterday, 2000, "Aluguel Apartamento", p1.lastInsertRowid, "Dividir", c4.lastInsertRowid);
    database.prepare("INSERT INTO despesas (data_compra, data_pagamento, valor, descricao, origem_id, destino, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(yesterday, yesterday, 50, "Uber", p2.lastInsertRowid, p1.lastInsertRowid.toString(), c3.lastInsertRowid);
    database.prepare("INSERT INTO despesas (data_compra, data_pagamento, valor, descricao, origem_id, destino, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(yesterday, yesterday, 120, "Supermercado", p1.lastInsertRowid, "Dividir", c1.lastInsertRowid);
    database.prepare("INSERT INTO despesas (data_compra, data_pagamento, valor, descricao, origem_id, destino, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(today, today, 45, "Farmácia", p2.lastInsertRowid, "Dividir", c1.lastInsertRowid);
    database.prepare("INSERT INTO despesas (data_compra, data_pagamento, valor, descricao, origem_id, destino, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(today, today, 200, "Presente", p1.lastInsertRowid, p2.lastInsertRowid.toString(), c2.lastInsertRowid);
  }
};

let dbInstance: Database.Database | null = null;

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    initDb(dbInstance);
    normalizeDates(dbInstance);
    seedData(dbInstance);
  }
  return dbInstance;
};

export const resetDbConnection = (newDb: Database.Database) => {
  if (dbInstance) {
    dbInstance.close();
  }
  dbInstance = newDb;
};
