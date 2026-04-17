'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const pool    = require('../../src/config/database');
const service = require('../../src/modules/tiposAnimais/tiposAnimais.service');

const TA_ROW = { id: 1, nome: 'Cachorro', ativo: true, criado_em: new Date() };

describe('tiposAnimais.service', () => {
  describe('listar()', () => {
    it('retorna array com { id, nome, ativo }', async () => {
      pool.query.mockResolvedValueOnce({ rows: [TA_ROW, { id: 2, nome: 'Gato', ativo: true }] });

      const result = await service.listar();

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
      expect(result[0]).toHaveProperty('ativo');
    });
  });

  describe('criar()', () => {
    it('retorna objeto completo após inserção', async () => {
      pool.query.mockResolvedValueOnce({ rows: [TA_ROW] });

      const result = await service.criar('Cachorro');

      expect(result).toMatchObject({ id: 1, nome: 'Cachorro', ativo: true });
    });

    it('lança 409 se nome já existe (ON CONFLICT DO NOTHING retorna [])', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.criar('Cachorro'))
        .rejects.toMatchObject({ status: 409, message: 'Tipo de animal já existe.' });
    });

    it('aplica trim() no nome antes de salvar', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ ...TA_ROW, nome: 'Peixe' }] });

      await service.criar('  Peixe  ');

      const call = pool.query.mock.calls[0];
      expect(call[1][0]).toBe('Peixe');
    });
  });

  describe('atualizar()', () => {
    it('retorna objeto atualizado', async () => {
      const updated = { ...TA_ROW, nome: 'Cachorro Grande' };
      pool.query.mockResolvedValueOnce({ rows: [updated] });

      const result = await service.atualizar(1, { nome: 'Cachorro Grande' });

      expect(result.nome).toBe('Cachorro Grande');
    });

    it('lança 404 se id não encontrado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.atualizar(9999, { nome: 'X' }))
        .rejects.toMatchObject({ status: 404, message: 'Tipo de animal não encontrado.' });
    });
  });

  describe('remover()', () => {
    it('executa UPDATE ativo=FALSE sem erro', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      await expect(service.remover(1)).resolves.toBeUndefined();
    });
  });
});
