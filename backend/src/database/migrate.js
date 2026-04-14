require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { pool, query } = require('../config/database');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function runMigrations() {
  console.log('Iniciando migrações...\n');

  try {
    // Criar tabela de controle de migrações
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ler arquivos de migração
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    // Buscar migrações já executadas
    const executed = await query('SELECT name FROM migrations');
    const executedNames = executed.rows.map(r => r.name);

    let migrationsRun = 0;

    for (const file of sqlFiles) {
      if (executedNames.includes(file)) {
        console.log(`✓ ${file} (já executada)`);
        continue;
      }

      console.log(`→ Executando ${file}...`);

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = await fs.readFile(filePath, 'utf8');

      await query(sql);
      await query('INSERT INTO migrations (name) VALUES ($1)', [file]);

      console.log(`✓ ${file} (executada com sucesso)`);
      migrationsRun++;
    }

    console.log(`\nMigrações concluídas. ${migrationsRun} nova(s) migração(ões) executada(s).`);
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
