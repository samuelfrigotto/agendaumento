const pool = require('../../config/database');

const CHAVES_PERMITIDAS = [
  'smtp_host','smtp_port','smtp_user','smtp_pass','smtp_from','smtp_ativo',
  'whatsapp_api_url','whatsapp_api_key','whatsapp_instance','whatsapp_ativo',
];

async function listar() {
  const { rows } = await pool.query(
    'SELECT chave, valor, descricao FROM configuracoes ORDER BY chave'
  );
  // Oculta senha SMTP
  return rows.map(r => ({
    ...r,
    valor: r.chave === 'smtp_pass' && r.valor ? '••••••••' : r.valor,
  }));
}

async function salvar(pares) {
  // pares = [{ chave, valor }]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { chave, valor } of pares) {
      if (!CHAVES_PERMITIDAS.includes(chave)) continue;
      await client.query(
        `INSERT INTO configuracoes (chave, valor, atualizado_em)
         VALUES ($1, $2, NOW())
         ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
        [chave, valor]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function get(chave) {
  const { rows } = await pool.query('SELECT valor FROM configuracoes WHERE chave = $1', [chave]);
  return rows[0]?.valor ?? null;
}

module.exports = { listar, salvar, get };
