'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const pool    = require('../../src/config/database');
const service = require('../../src/modules/servicos/servicos.service');

// Linha retornada por _buscarCompleto (com tipos_animais)
const SERVICO_COMPLETO = {
  id: 1, nome: 'Banho', descricao: 'Banho completo', preco: '50.00',
  duracao_minutos: 60, ativo: true,
  tipos_animais: [{ id: 1, nome: 'Cachorro' }],
};

// Cria um mock de client transacional
function mockClient(...results) {
  const client = { query: jest.fn(), release: jest.fn() };
  client.query.mockResolvedValueOnce({}); // BEGIN
  results.forEach(r => client.query.mockResolvedValueOnce(r));
  client.query.mockResolvedValueOnce({}); // COMMIT
  pool.connect.mockResolvedValueOnce(client);
  return client;
}

describe('servicos.service', () => {
  describe('listar()', () => {
    it('retorna array com tipos_animais embutido', async () => {
      pool.query.mockResolvedValueOnce({ rows: [SERVICO_COMPLETO] });

      const result = await service.listar();

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('tipos_animais');
      expect(Array.isArray(result[0].tipos_animais)).toBe(true);
    });

    it('retorna todos (ativos + inativos) quando apenasAtivos=false', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await service.listar({ apenasAtivos: false });
      const sql = pool.query.mock.calls[0][0];
      expect(sql).not.toContain('WHERE s.ativo = TRUE');
    });
  });

  describe('criar()', () => {
    it('retorna serviço COMPLETO (com tipos_animais) após criação', async () => {
      // Transaction: BEGIN, INSERT, INSERT tipo, COMMIT
      mockClient({ rows: [{ id: 1 }] }, { rows: [] });
      // _buscarCompleto chama pool.query depois do COMMIT
      pool.query.mockResolvedValueOnce({ rows: [SERVICO_COMPLETO] });

      const result = await service.criar({
        nome: 'Banho', preco: 50, tipos_animais: [1],
      });

      expect(result).toHaveProperty('tipos_animais');
      expect(result).toHaveProperty('nome', 'Banho');
    });

    it('cria sem tipos_animais quando array não fornecido', async () => {
      mockClient({ rows: [{ id: 2 }] });
      pool.query.mockResolvedValueOnce({ rows: [{ ...SERVICO_COMPLETO, id: 2, tipos_animais: [] }] });

      const result = await service.criar({ nome: 'Tosa', preco: 30 });
      expect(result.tipos_animais).toEqual([]);
    });
  });

  describe('atualizar()', () => {
    it('retorna serviço COMPLETO após atualização', async () => {
      mockClient({ rows: [{ id: 1 }] });
      pool.query.mockResolvedValueOnce({ rows: [{ ...SERVICO_COMPLETO, nome: 'Banho Premium' }] });

      const result = await service.atualizar(1, { nome: 'Banho Premium' });

      expect(result).toHaveProperty('tipos_animais');
      expect(result.nome).toBe('Banho Premium');
    });

    it('lança 404 se serviço não existe', async () => {
      mockClient({ rows: [] }); // UPDATE não encontra a linha
      // COMMIT não acontece — ROLLBACK será chamado

      await expect(service.atualizar(9999, { nome: 'X' }))
        .rejects.toMatchObject({ status: 404, message: 'Serviço não encontrado.' });
    });
  });

  describe('remover()', () => {
    it('executa UPDATE ativo=FALSE sem erro', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      await expect(service.remover(1)).resolves.toBeUndefined();
    });
  });
});
