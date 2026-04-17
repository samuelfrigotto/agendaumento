'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const pool    = require('../../src/config/database');
const service = require('../../src/modules/clientes/clientes.service');

const CLIENTE = {
  id: 1, nome: 'Maria Souza', cpf: '11122233344',
  telefone: '21988887777', email: 'maria@email.com',
  endereco: 'Rua B, 10', ativo: true, criado_em: new Date(),
};

describe('clientes.service', () => {
  describe('listar()', () => {
    it('retorna { dados, total, pagina, limite }', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [CLIENTE] })       // SELECT dados
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // SELECT COUNT

      const result = await service.listar({ pagina: 1, limite: 20, busca: '' });

      expect(result).toHaveProperty('dados');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('pagina', 1);
      expect(result).toHaveProperty('limite', 20);
      expect(result.dados[0]).toMatchObject({ id: 1, nome: 'Maria Souza' });
    });

    it('total é sempre número (não string)', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '42' }] });

      const result = await service.listar({ pagina: 1, limite: 20, busca: '' });
      expect(typeof result.total).toBe('number');
      expect(result.total).toBe(42);
    });

    it('calcula offset corretamente para pagina 3 limite 10', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await service.listar({ pagina: 3, limite: 10, busca: '' });

      const call = pool.query.mock.calls[0];
      // offset = (3-1)*10 = 20, passado como $3
      expect(call[1][2]).toBe(20);
    });
  });

  describe('buscarPorId()', () => {
    it('retorna objeto do cliente com campos esperados', async () => {
      pool.query.mockResolvedValueOnce({ rows: [CLIENTE] });

      const result = await service.buscarPorId(1);

      expect(result).toMatchObject({ id: 1, nome: 'Maria Souza', cpf: '11122233344' });
      expect(result).toHaveProperty('endereco');
      expect(result).toHaveProperty('ativo');
      expect(result).toHaveProperty('criado_em');
      expect(result).not.toHaveProperty('senha_hash');
    });

    it('lança 404 se não encontrado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.buscarPorId(9999))
        .rejects.toMatchObject({ status: 404, message: 'Cliente não encontrado.' });
    });
  });

  describe('pets()', () => {
    it('retorna array com tipo_animal_id E tipo_animal (nome)', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 5, nome: 'Rex', raca: 'Labrador', idade: 3,
          observacoes: null, ativo: true,
          tipo_animal_id: 1, tipo_animal: 'Cachorro',
        }],
      });

      const result = await service.pets(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('tipo_animal_id');
      expect(result[0]).toHaveProperty('tipo_animal', 'Cachorro');
    });

    it('retorna array vazio se cliente não tem pets', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await service.pets(99);
      expect(result).toEqual([]);
    });
  });

  describe('desativar()', () => {
    it('executa UPDATE sem lançar erro', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      await expect(service.desativar(1)).resolves.toBeUndefined();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ativo = FALSE'),
        [1]
      );
    });
  });
});
