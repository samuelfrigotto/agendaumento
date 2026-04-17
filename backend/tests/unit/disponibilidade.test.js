'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const pool    = require('../../src/config/database');
const service = require('../../src/modules/disponibilidade/disponibilidade.service');

function mockClient(...results) {
  const client = { query: jest.fn(), release: jest.fn() };
  client.query.mockResolvedValueOnce({}); // BEGIN
  results.forEach(r => client.query.mockResolvedValueOnce(r));
  client.query.mockResolvedValueOnce({}); // COMMIT
  pool.connect.mockResolvedValueOnce(client);
  return client;
}

const REGRA = { id: 1, dia_semana: 1, hora_inicio: '08:00:00', hora_fim: '18:00:00', ativo: true };
const BLOQ  = { id: 1, data_inicio: '2026-12-24', data_fim: '2026-12-26', motivo: 'Natal', criado_em: new Date() };

describe('disponibilidade.service', () => {
  describe('listarRegras()', () => {
    it('retorna array com { id, dia_semana, hora_inicio, hora_fim, ativo }', async () => {
      pool.query.mockResolvedValueOnce({ rows: [REGRA] });

      const result = await service.listarRegras();

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toMatchObject({ id: 1, dia_semana: 1, hora_inicio: '08:00:00', hora_fim: '18:00:00' });
    });
  });

  describe('salvarRegras()', () => {
    it('executa DELETE + INSERT para cada regra dentro de transação', async () => {
      const client = mockClient(
        { rowCount: 0 }, // DELETE
        { rows: [] },    // INSERT regra 1
        { rows: [] }     // INSERT regra 2
      );

      const regras = [
        { dia_semana: 1, hora_inicio: '08:00', hora_fim: '12:00' },
        { dia_semana: 2, hora_inicio: '08:00', hora_fim: '12:00' },
      ];
      await service.salvarRegras(regras);

      // BEGIN + DELETE + 2×INSERT + COMMIT = 5 chamadas
      expect(client.query).toHaveBeenCalledTimes(5);
      const calls = client.query.mock.calls.map(c => c[0]);
      expect(calls[0]).toBe('BEGIN');
      expect(calls[1]).toContain('DELETE FROM disponibilidade');
      expect(calls[calls.length - 1]).toBe('COMMIT');
    });
  });

  describe('listarBloqueados()', () => {
    it('retorna array com { id, data_inicio, data_fim, motivo }', async () => {
      pool.query.mockResolvedValueOnce({ rows: [BLOQ] });

      const result = await service.listarBloqueados();

      expect(result[0]).toMatchObject({ id: 1, data_inicio: '2026-12-24', data_fim: '2026-12-26', motivo: 'Natal' });
    });
  });

  describe('adicionarBloqueio()', () => {
    it('retorna objeto do bloqueio inserido', async () => {
      pool.query.mockResolvedValueOnce({ rows: [BLOQ] });

      const result = await service.adicionarBloqueio({
        data_inicio: '2026-12-24', data_fim: '2026-12-26', motivo: 'Natal',
      });

      expect(result).toMatchObject({ id: 1, data_inicio: '2026-12-24' });
      expect(result).toHaveProperty('criado_em');
    });
  });

  describe('removerBloqueio()', () => {
    it('executa DELETE sem erro', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      await expect(service.removerBloqueio(1)).resolves.toBeUndefined();
    });
  });

  describe('slotsDisponiveis()', () => {
    it('retorna [] se data está bloqueada', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }] }); // bloqueio existe

      const result = await service.slotsDisponiveis('2026-12-25');
      expect(result).toEqual([]);
    });

    it('retorna [] se dia da semana não tem regra', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })  // sem bloqueio
        .mockResolvedValueOnce({ rows: [] }); // sem regra

      const result = await service.slotsDisponiveis('2026-12-25');
      expect(result).toEqual([]);
    });

    it('retorna slots corretos para janela sem agendamentos', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })   // sem bloqueio
        .mockResolvedValueOnce({ rows: [{ hora_inicio: '08:00:00', hora_fim: '10:00:00' }] })
        .mockResolvedValueOnce({ rows: [] });  // sem agendamentos

      // Data com dia_semana calculável: 2026-01-05 = segunda (dia 1)
      const result = await service.slotsDisponiveis('2026-01-05', 60);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('08:00');
      expect(result).toContain('09:00');
      expect(result).not.toContain('10:00'); // 10:00 + 60min ultrapassa 10:00
    });

    it('exclui slot ocupado por agendamento existente', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // sem bloqueio
        .mockResolvedValueOnce({ rows: [{ hora_inicio: '08:00:00', hora_fim: '10:00:00' }] })
        .mockResolvedValueOnce({ rows: [{ data_hora: '2026-01-05T08:00:00-03:00', duracao_minutos: 60 }] });

      const result = await service.slotsDisponiveis('2026-01-05', 60);

      expect(result).not.toContain('08:00');
      expect(result).toContain('09:00');
    });
  });
});
