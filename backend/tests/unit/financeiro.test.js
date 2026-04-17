'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const pool    = require('../../src/config/database');
const service = require('../../src/modules/financeiro/financeiro.service');

describe('financeiro.service', () => {
  describe('resumo()', () => {
    it('retorna números (não strings) — converte COUNT e SUM do pg', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          total_concluidos: '5',   // pg retorna string
          total_cancelados: '2',
          total_pendentes:  '3',
          receita_total:    '750.00',
        }],
      });

      const result = await service.resumo({ mes: 5, ano: 2026 });

      expect(typeof result.total_concluidos).toBe('number');
      expect(typeof result.total_cancelados).toBe('number');
      expect(typeof result.total_pendentes).toBe('number');
      expect(typeof result.receita_total).toBe('number');

      expect(result.total_concluidos).toBe(5);
      expect(result.total_cancelados).toBe(2);
      expect(result.total_pendentes).toBe(3);
      expect(result.receita_total).toBe(750);
    });

    it('retorna zeros quando não há agendamentos no mês', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          total_concluidos: '0',
          total_cancelados: '0',
          total_pendentes:  '0',
          receita_total:    '0',
        }],
      });

      const result = await service.resumo({ mes: 1, ano: 2026 });

      expect(result.total_concluidos).toBe(0);
      expect(result.receita_total).toBe(0);
    });

    it('tem exatamente as 4 chaves esperadas', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ total_concluidos: '1', total_cancelados: '0', total_pendentes: '0', receita_total: '50.00' }],
      });

      const result = await service.resumo({ mes: 5, ano: 2026 });

      expect(Object.keys(result).sort()).toEqual(
        ['receita_total', 'total_cancelados', 'total_concluidos', 'total_pendentes'].sort()
      );
    });
  });

  describe('listarServicos()', () => {
    it('retorna array com campos cliente_nome, pet_nome, servico_nome', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1, data_hora: new Date(), status: 'concluido',
          valor_cobrado: '50.00', origem: 'cliente',
          cliente_nome: 'João', pet_nome: 'Rex', servico_nome: 'Banho',
        }],
      });

      const result = await service.listarServicos({ mes: 5, ano: 2026 });

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('cliente_nome');
      expect(result[0]).toHaveProperty('pet_nome');
      expect(result[0]).toHaveProperty('servico_nome');
      expect(result[0]).toHaveProperty('valor_cobrado');
    });

    it('filtra por status quando fornecido', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await service.listarServicos({ mes: 5, ano: 2026, status: 'concluido' });

      const sql = pool.query.mock.calls[0][0];
      expect(sql).toContain('a.status =');
    });
  });
});
