'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const pool    = require('../../src/config/database');
const service = require('../../src/modules/pets/pets.service');

const PET_ROW = {
  id: 5, cliente_id: 10, tipo_animal_id: 1, nome: 'Rex',
  raca: 'Labrador', idade: 3, observacoes: null, ativo: true, criado_em: new Date(),
};
const PET_LISTA = {
  id: 5, nome: 'Rex', raca: 'Labrador', idade: 3,
  observacoes: null, ativo: true,
  tipo_animal_id: 1, tipo_animal: 'Cachorro',
};

describe('pets.service', () => {
  describe('listarDoCliente()', () => {
    it('retorna array com tipo_animal_id e tipo_animal', async () => {
      pool.query.mockResolvedValueOnce({ rows: [PET_LISTA] });

      const result = await service.listarDoCliente(10);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('tipo_animal_id');
      expect(result[0]).toHaveProperty('tipo_animal');
      // Não deve expor cliente_id aqui (campo não está no SELECT da lista)
    });

    it('retorna [] se cliente não tem pets', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      expect(await service.listarDoCliente(99)).toEqual([]);
    });
  });

  describe('criar()', () => {
    it('retorna objeto completo do pet criado (RETURNING *)', async () => {
      pool.query.mockResolvedValueOnce({ rows: [PET_ROW] });

      const result = await service.criar({
        clienteId: 10, tipo_animal_id: 1, nome: 'Rex', raca: 'Labrador',
      });

      expect(result).toMatchObject({
        id: 5, cliente_id: 10, tipo_animal_id: 1, nome: 'Rex',
      });
      expect(result).toHaveProperty('ativo');
      expect(result).toHaveProperty('criado_em');
    });

    it('passa null para campos opcionais ausentes', async () => {
      pool.query.mockResolvedValueOnce({ rows: [PET_ROW] });

      await service.criar({ clienteId: 10, tipo_animal_id: 1, nome: 'Rex' });

      const call = pool.query.mock.calls[0];
      // raca, idade, observacoes devem ser null
      expect(call[1][3]).toBeNull(); // raca
      expect(call[1][4]).toBeNull(); // idade
      expect(call[1][5]).toBeNull(); // observacoes
    });
  });

  describe('atualizar()', () => {
    it('retorna objeto atualizado', async () => {
      const updated = { ...PET_ROW, nome: 'Rexão' };
      pool.query.mockResolvedValueOnce({ rows: [updated] });

      const result = await service.atualizar(5, 10, { nome: 'Rexão' });

      expect(result.nome).toBe('Rexão');
    });

    it('lança 404 se pet não pertence ao cliente', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.atualizar(5, 99, { nome: 'X' }))
        .rejects.toMatchObject({ status: 404, message: 'Pet não encontrado.' });
    });
  });

  describe('remover()', () => {
    it('executa UPDATE ativo=FALSE sem erro', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      await expect(service.remover(5, 10)).resolves.toBeUndefined();
    });
  });
});
