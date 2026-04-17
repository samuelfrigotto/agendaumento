'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const pool    = require('../../src/config/database');
const service = require('../../src/modules/agendamentos/agendamentos.service');

// Shape completo devolvido por buscarPorId / SELECT_BASE
const AGEND_COMPLETO = {
  id: 1,
  data_hora: '2026-05-10T10:00:00.000Z',
  status: 'pendente',
  origem: 'cliente',
  observacoes: null,
  valor_cobrado: '50.00',
  criado_em: new Date(),
  cliente_id: 10,
  cliente_nome: 'João',
  cliente_telefone: '11999999999',
  nome_avulso: null,
  telefone_avulso: null,
  pet_id: 5,
  pet_nome: 'Rex',
  pet_nome_avulso: null,
  servico_id: 1,
  servico_nome: 'Banho',
  servico_preco: '50.00',
  duracao_minutos: 60,
};

// Configura pool.query para devolver AGEND_COMPLETO na chamada de buscarPorId
function mockBuscarPorId() {
  pool.query.mockResolvedValueOnce({ rows: [AGEND_COMPLETO] });
}

describe('agendamentos.service', () => {
  describe('listar()', () => {
    it('retorna array com shape completo do agendamento', async () => {
      pool.query.mockResolvedValueOnce({ rows: [AGEND_COMPLETO] });

      const result = await service.listar({ pagina: 1, limite: 10 });

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('cliente_nome');
      expect(result[0]).toHaveProperty('pet_nome');
      expect(result[0]).toHaveProperty('servico_nome');
      expect(result[0]).toHaveProperty('duracao_minutos');
    });
  });

  describe('agenda()', () => {
    it('retorna array ordenado por data_hora sem cancelados', async () => {
      pool.query.mockResolvedValueOnce({ rows: [AGEND_COMPLETO] });

      const result = await service.agenda('2026-05-10', '2026-05-17');

      expect(Array.isArray(result)).toBe(true);
      const sql = pool.query.mock.calls[0][0];
      expect(sql).toContain("status NOT IN ('cancelado')");
    });
  });

  describe('buscarPorId()', () => {
    it('retorna objeto completo', async () => {
      pool.query.mockResolvedValueOnce({ rows: [AGEND_COMPLETO] });

      const result = await service.buscarPorId(1);

      expect(result).toMatchObject({ id: 1, servico_nome: 'Banho', pet_nome: 'Rex' });
    });

    it('lança 404 se não encontrado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.buscarPorId(9999))
        .rejects.toMatchObject({ status: 404, message: 'Agendamento não encontrado.' });
    });
  });

  describe('criarPeloCliente()', () => {
    it('valida pet, valida serviço, insere e retorna objeto completo', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 5 }] })        // pet válido
        .mockResolvedValueOnce({ rows: [{ preco: '50.00' }] }) // serviço válido
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })        // INSERT RETURNING id
        .mockResolvedValueOnce({ rows: [AGEND_COMPLETO] });   // buscarPorId

      const result = await service.criarPeloCliente({
        clienteId: 10, petId: 5, servicoId: 1, dataHora: '2026-05-10T10:00:00', observacoes: null,
      });

      expect(result).toMatchObject({ id: 1, servico_nome: 'Banho' });
      expect(result).not.toHaveProperty('senha_hash');
    });

    it('lança 400 se pet não pertence ao cliente', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // pet não encontrado

      await expect(service.criarPeloCliente({ clienteId: 10, petId: 99, servicoId: 1, dataHora: '2026-05-10' }))
        .rejects.toMatchObject({ status: 400, message: 'Pet inválido.' });
    });

    it('lança 400 se serviço está inativo', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // pet ok
        .mockResolvedValueOnce({ rows: [] });          // serviço não encontrado

      await expect(service.criarPeloCliente({ clienteId: 10, petId: 5, servicoId: 999, dataHora: '2026-05-10' }))
        .rejects.toMatchObject({ status: 400, message: 'Serviço inválido.' });
    });
  });

  describe('criarPeloAdmin()', () => {
    it('cria agendamento avulso (sem cliente cadastrado) e retorna completo', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ preco: '50.00' }] }) // serviço
        .mockResolvedValueOnce({ rows: [{ id: 2 }] })          // INSERT
        .mockResolvedValueOnce({ rows: [{ ...AGEND_COMPLETO, id: 2, origem: 'admin', cliente_id: null, nome_avulso: 'Fulano' }] });

      const result = await service.criarPeloAdmin({
        servicoId: 1, dataHora: '2026-05-10T14:00:00',
        nomeAvulso: 'Fulano', telefoneAvulso: '11988887777', petNomeAvulso: 'Bolinha',
      });

      expect(result.origem).toBe('admin');
    });

    it('lança 400 se serviço não existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.criarPeloAdmin({ servicoId: 9999, dataHora: '2026-05-10' }))
        .rejects.toMatchObject({ status: 400, message: 'Serviço inválido.' });
    });
  });

  describe('atualizarStatus()', () => {
    it('retorna objeto completo após atualização', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })       // UPDATE RETURNING id
        .mockResolvedValueOnce({ rows: [{ ...AGEND_COMPLETO, status: 'concluido' }] });

      const result = await service.atualizarStatus(1, 'concluido');

      expect(result.status).toBe('concluido');
      expect(result).toHaveProperty('servico_nome');
    });

    it('lança 404 se agendamento não encontrado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.atualizarStatus(9999, 'concluido'))
        .rejects.toMatchObject({ status: 404, message: 'Agendamento não encontrado.' });
    });
  });

  describe('cancelarPeloCliente()', () => {
    it('retorna objeto COMPLETO após cancelamento (não só { id })', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })                              // UPDATE
        .mockResolvedValueOnce({ rows: [{ ...AGEND_COMPLETO, status: 'cancelado' }] }); // buscarPorId

      const result = await service.cancelarPeloCliente(1, 10);

      // Deve ser o objeto completo, não apenas { id }
      expect(result).toHaveProperty('servico_nome');
      expect(result).toHaveProperty('pet_nome');
      expect(result.status).toBe('cancelado');
    });

    it('lança 404 se agendamento não está pendente ou não pertence ao cliente', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.cancelarPeloCliente(1, 99))
        .rejects.toMatchObject({ status: 404 });
    });
  });

  describe('listarDoCliente()', () => {
    it('retorna array com shape completo', async () => {
      pool.query.mockResolvedValueOnce({ rows: [AGEND_COMPLETO] });

      const result = await service.listarDoCliente(10);

      expect(result[0]).toHaveProperty('servico_nome');
      expect(result[0]).toHaveProperty('cliente_id', 10);
    });
  });
});
