'use strict';

/**
 * Teste de integração — testa toda a camada HTTP:
 * rotas → middlewares → controllers → services (mockados)
 *
 * O banco de dados nunca é tocado: pool.query é mockado globalmente.
 */

process.env.JWT_SECRET    = 'test_secret_integracao';
process.env.NODE_ENV      = 'test';
process.env.FRONTEND_URL  = 'http://localhost:5173';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../../src/app');
const pool    = require('../../src/config/database');

const SECRET = 'test_secret_integracao';

const adminToken   = jwt.sign({ id: 1, nome: 'Admin', email: 'a@a.com', role: 'admin' },   SECRET);
const clienteToken = jwt.sign({ id: 10, nome: 'João',                    role: 'cliente' }, SECRET);

const authAdmin   = { Authorization: `Bearer ${adminToken}` };
const authCliente = { Authorization: `Bearer ${clienteToken}` };

// ─── helpers ────────────────────────────────────────────────────────────────

function mockTransactionClient(...queryResults) {
  const client = { query: jest.fn(), release: jest.fn() };
  client.query.mockResolvedValueOnce({}); // BEGIN
  queryResults.forEach(r => client.query.mockResolvedValueOnce(r));
  client.query.mockResolvedValueOnce({}); // COMMIT
  pool.connect.mockResolvedValue(client);
}

// ─── testes ─────────────────────────────────────────────────────────────────

describe('API — integração', () => {

  // ── Health ───────────────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    it('200 com { status: "ok", ts }', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('ts');
    });
  });

  // ── 404 ─────────────────────────────────────────────────────────────────
  describe('Rota inexistente', () => {
    it('404 com { erro }', async () => {
      const res = await request(app).get('/api/nao-existe');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('erro');
    });
  });

  // ── Admin Auth ──────────────────────────────────────────────────────────
  describe('POST /api/admin/auth/login', () => {
    const HASH = require('bcryptjs').hashSync('Admin@123', 10);

    it('200 com token e admin ao usar credenciais corretas', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Admin 1', email: 'admin1@clinica.com', senha_hash: HASH, ativo: true }],
      });

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: 'admin1@clinica.com', senha: 'Admin@123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('admin');
      expect(res.body.admin).toHaveProperty('email', 'admin1@clinica.com');
      expect(res.body.admin).not.toHaveProperty('senha_hash');
    });

    it('422 quando email ausente', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ senha: 'Admin@123' });
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('detalhes');
    });

    it('401 com credenciais incorretas', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: 'x@x.com', senha: 'errada' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('erro');
    });
  });

  // ── Cliente Auth ────────────────────────────────────────────────────────
  describe('POST /api/auth/registrar', () => {
    it('201 com token e cliente ao registrar', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })  // sem duplicata
        .mockResolvedValueOnce({ rows: [{ id: 10, nome: 'João', cpf: '12345678901', telefone: '11999999999', email: null }] });

      const res = await request(app)
        .post('/api/auth/registrar')
        .send({ nome: 'João Silva', cpf: '12345678901', telefone: '11999999999', senha: 'senha123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('cliente');
    });

    it('422 quando nome ausente', async () => {
      const res = await request(app)
        .post('/api/auth/registrar')
        .send({ cpf: '12345678901', telefone: '11', senha: '123456' });
      expect(res.status).toBe(422);
    });

    it('422 quando CPF inválido', async () => {
      const res = await request(app)
        .post('/api/auth/registrar')
        .send({ nome: 'X', cpf: 'cpf-invalido', telefone: '11', senha: '123456' });
      expect(res.status).toBe(422);
    });

    it('409 quando CPF já cadastrado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });

      const res = await request(app)
        .post('/api/auth/registrar')
        .send({ nome: 'Ana', cpf: '12345678901', telefone: '11', senha: '123456' });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('401 sem credenciais no banco', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nao@existe.com', senha: 'abc' });
      expect(res.status).toBe(401);
    });

    it('422 quando senha ausente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'a@a.com' });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/auth/perfil', () => {
    it('401 sem token', async () => {
      const res = await request(app).get('/api/auth/perfil');
      expect(res.status).toBe(401);
    });

    it('200 com token válido', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 10, nome: 'João', cpf: '12345678901', telefone: '11', endereco: null, email: null, criado_em: new Date() }],
      });

      const res = await request(app)
        .get('/api/auth/perfil')
        .set(authCliente);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 10);
    });
  });

  // ── Tipos de animais (público) ──────────────────────────────────────────
  describe('GET /api/tipos-animais', () => {
    it('200 sem autenticação', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Cachorro', ativo: true }, { id: 2, nome: 'Gato', ativo: true }],
      });

      const res = await request(app).get('/api/tipos-animais');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/tipos-animais', () => {
    it('401 sem token admin', async () => {
      const res = await request(app).post('/api/tipos-animais').send({ nome: 'Peixe' });
      expect(res.status).toBe(401);
    });

    it('403 com token de cliente', async () => {
      const res = await request(app)
        .post('/api/tipos-animais')
        .set(authCliente)
        .send({ nome: 'Peixe' });
      expect(res.status).toBe(403);
    });

    it('201 com token admin', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 3, nome: 'Peixe', ativo: true, criado_em: new Date() }],
      });

      const res = await request(app)
        .post('/api/tipos-animais')
        .set(authAdmin)
        .send({ nome: 'Peixe' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('nome', 'Peixe');
    });
  });

  // ── Serviços ────────────────────────────────────────────────────────────
  describe('GET /api/servicos', () => {
    it('200 público com tipos_animais embutido', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Banho', descricao: null, preco: '50.00', duracao_minutos: 60, ativo: true, tipos_animais: [] }],
      });

      const res = await request(app).get('/api/servicos');
      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty('tipos_animais');
    });
  });

  // ── Disponibilidade (pública) ───────────────────────────────────────────
  describe('GET /api/disponibilidade/slots', () => {
    it('200 com ?data=YYYY-MM-DD', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })  // sem bloqueio
        .mockResolvedValueOnce({ rows: [] }); // sem regra → slots = []

      const res = await request(app).get('/api/disponibilidade/slots?data=2026-07-01');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data', '2026-07-01');
      expect(res.body).toHaveProperty('slots');
      expect(Array.isArray(res.body.slots)).toBe(true);
    });

    it('400 sem parâmetro data', async () => {
      const res = await request(app).get('/api/disponibilidade/slots');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('erro');
    });
  });

  // ── Pets (requer auth cliente) ──────────────────────────────────────────
  describe('GET /api/pets', () => {
    it('401 sem token', async () => {
      const res = await request(app).get('/api/pets');
      expect(res.status).toBe(401);
    });

    it('200 com token cliente', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/pets').set(authCliente);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/pets', () => {
    it('422 quando tipo_animal_id ausente', async () => {
      const res = await request(app)
        .post('/api/pets')
        .set(authCliente)
        .send({ nome: 'Rex' });
      expect(res.status).toBe(422);
    });

    it('201 com dados completos', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 5, cliente_id: 10, tipo_animal_id: 1, nome: 'Rex', raca: null, idade: null, observacoes: null, ativo: true, criado_em: new Date() }],
      });

      const res = await request(app)
        .post('/api/pets')
        .set(authCliente)
        .send({ tipo_animal_id: 1, nome: 'Rex' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('nome', 'Rex');
    });
  });

  // ── Agendamentos (cliente) ──────────────────────────────────────────────
  describe('GET /api/agendamentos/meus', () => {
    it('401 sem token', async () => {
      const res = await request(app).get('/api/agendamentos/meus');
      expect(res.status).toBe(401);
    });

    it('200 com token cliente', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/agendamentos/meus').set(authCliente);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/agendamentos', () => {
    it('422 quando dataHora ausente', async () => {
      const res = await request(app)
        .post('/api/agendamentos')
        .set(authCliente)
        .send({ petId: 5, servicoId: 1 });
      expect(res.status).toBe(422);
    });

    it('422 quando dataHora não é ISO8601', async () => {
      const res = await request(app)
        .post('/api/agendamentos')
        .set(authCliente)
        .send({ petId: 5, servicoId: 1, dataHora: 'amanhã' });
      expect(res.status).toBe(422);
    });
  });

  // ── Admin — clientes ────────────────────────────────────────────────────
  describe('GET /api/admin/clientes', () => {
    it('401 sem token', async () => {
      const res = await request(app).get('/api/admin/clientes');
      expect(res.status).toBe(401);
    });

    it('403 com token de cliente', async () => {
      const res = await request(app).get('/api/admin/clientes').set(authCliente);
      expect(res.status).toBe(403);
    });

    it('200 com token admin — retorna { dados, total, pagina, limite }', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const res = await request(app).get('/api/admin/clientes').set(authAdmin);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dados');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('pagina');
      expect(res.body).toHaveProperty('limite');
    });
  });

  // ── Admin — agenda ──────────────────────────────────────────────────────
  describe('GET /api/agendamentos/admin/agenda', () => {
    it('401 sem token', async () => {
      const res = await request(app).get('/api/agendamentos/admin/agenda?inicio=2026-05-01&fim=2026-05-07');
      expect(res.status).toBe(401);
    });

    it('400 sem parâmetros inicio/fim', async () => {
      const res = await request(app)
        .get('/api/agendamentos/admin/agenda')
        .set(authAdmin);
      expect(res.status).toBe(400);
    });

    it('200 com token admin e datas válidas', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/agendamentos/admin/agenda?inicio=2026-05-01&fim=2026-05-07')
        .set(authAdmin);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Admin — financeiro ──────────────────────────────────────────────────
  describe('GET /api/admin/financeiro/resumo', () => {
    it('401 sem token', async () => {
      const res = await request(app).get('/api/admin/financeiro/resumo');
      expect(res.status).toBe(401);
    });

    it('200 com números (não strings)', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ total_concluidos: '3', total_cancelados: '1', total_pendentes: '2', receita_total: '150.00' }],
      });

      const res = await request(app).get('/api/admin/financeiro/resumo').set(authAdmin);
      expect(res.status).toBe(200);
      expect(typeof res.body.total_concluidos).toBe('number');
      expect(typeof res.body.receita_total).toBe('number');
    });
  });

  // ── Admin — configurações ───────────────────────────────────────────────
  describe('GET /api/admin/configuracoes', () => {
    it('401 sem token', async () => {
      const res = await request(app).get('/api/admin/configuracoes');
      expect(res.status).toBe(401);
    });

    it('200 com token admin — smtp_pass ocultado', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { chave: 'smtp_host', valor: 'smtp.gmail.com', descricao: 'Host' },
          { chave: 'smtp_pass', valor: 'segredo',        descricao: 'Senha' },
        ],
      });

      const res = await request(app).get('/api/admin/configuracoes').set(authAdmin);
      expect(res.status).toBe(200);

      const smtpPass = res.body.find(c => c.chave === 'smtp_pass');
      expect(smtpPass.valor).toBe('••••••••');
    });
  });

  describe('PUT /api/admin/configuracoes', () => {
    it('200 ao salvar configurações', async () => {
      mockTransactionClient({ rows: [] }); // INSERT smtp_host

      const res = await request(app)
        .put('/api/admin/configuracoes')
        .set(authAdmin)
        .send({ smtp_host: 'smtp.gmail.com' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('mensagem');
    });
  });

  // ── Admin — disponibilidade ─────────────────────────────────────────────
  describe('GET /api/disponibilidade/regras', () => {
    it('401 sem token', async () => {
      const res = await request(app).get('/api/disponibilidade/regras');
      expect(res.status).toBe(401);
    });

    it('200 com token admin', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/disponibilidade/regras').set(authAdmin);
      expect(res.status).toBe(200);
    });
  });

  // ── Admin — agendamento manual ─────────────────────────────────────────
  describe('POST /api/agendamentos/admin', () => {
    it('422 quando servicoId ausente', async () => {
      const res = await request(app)
        .post('/api/agendamentos/admin')
        .set(authAdmin)
        .send({ dataHora: '2026-05-10T10:00:00Z' });
      expect(res.status).toBe(422);
    });

    it('422 quando dataHora não é ISO8601', async () => {
      const res = await request(app)
        .post('/api/agendamentos/admin')
        .set(authAdmin)
        .send({ servicoId: 1, dataHora: 'amanhã' });
      expect(res.status).toBe(422);
    });
  });

  // ── Admin — status agendamento ─────────────────────────────────────────
  describe('PATCH /api/agendamentos/admin/:id/status', () => {
    it('422 com status inválido', async () => {
      const res = await request(app)
        .patch('/api/agendamentos/admin/1/status')
        .set(authAdmin)
        .send({ status: 'invalido' });
      expect(res.status).toBe(422);
    });
  });
});
