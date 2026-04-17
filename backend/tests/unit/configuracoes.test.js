'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const pool    = require('../../src/config/database');
const service = require('../../src/modules/configuracoes/configuracoes.service');

function mockClient(...results) {
  const client = { query: jest.fn(), release: jest.fn() };
  client.query.mockResolvedValueOnce({}); // BEGIN
  results.forEach(r => client.query.mockResolvedValueOnce(r));
  client.query.mockResolvedValueOnce({}); // COMMIT
  pool.connect.mockResolvedValueOnce(client);
  return client;
}

describe('configuracoes.service', () => {
  describe('listar()', () => {
    it('retorna array com { chave, valor, descricao }', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { chave: 'smtp_host', valor: 'smtp.gmail.com', descricao: 'Host SMTP' },
          { chave: 'smtp_pass', valor: 'minhaSenha', descricao: 'Senha SMTP' },
        ],
      });

      const result = await service.listar();

      expect(result[0]).toHaveProperty('chave', 'smtp_host');
      expect(result[0]).toHaveProperty('valor', 'smtp.gmail.com');
      expect(result[0]).toHaveProperty('descricao');
    });

    it('oculta valor de smtp_pass com ••••••••', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ chave: 'smtp_pass', valor: 'segredo123', descricao: 'Senha' }],
      });

      const result = await service.listar();

      expect(result[0].valor).toBe('••••••••');
    });

    it('retorna null para smtp_pass quando valor é null', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ chave: 'smtp_pass', valor: null, descricao: 'Senha' }],
      });

      const result = await service.listar();

      expect(result[0].valor).toBeNull();
    });
  });

  describe('salvar()', () => {
    it('persiste apenas chaves da lista permitida, ignora inválidas', async () => {
      const client = mockClient(
        { rows: [] }, // smtp_host
        // chave_invalida é ignorada — sem query extra
      );

      await service.salvar([
        { chave: 'smtp_host', valor: 'smtp.gmail.com' },
        { chave: 'chave_invalida', valor: 'x' },
      ]);

      // BEGIN + 1 INSERT (smtp_host apenas) + COMMIT = 3 chamadas
      expect(client.query).toHaveBeenCalledTimes(3);
    });

    it('aceita formato objeto { chave: valor } via controller', async () => {
      // Testa via controller que converte objeto → array
      const ctrl = require('../../src/modules/configuracoes/configuracoes.controller');
      const mockRes  = { json: jest.fn() };
      const mockNext = jest.fn();

      // Mock service.salvar diretamente para este teste
      jest.spyOn(service, 'salvar').mockResolvedValueOnce();

      await ctrl.salvar(
        { body: { smtp_host: 'smtp.gmail.com', smtp_port: '587' } },
        mockRes,
        mockNext
      );

      expect(service.salvar).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ chave: 'smtp_host', valor: 'smtp.gmail.com' }),
          expect.objectContaining({ chave: 'smtp_port', valor: '587' }),
        ])
      );
    });
  });

  describe('get()', () => {
    it('retorna string quando chave existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ valor: 'smtp.gmail.com' }] });

      const result = await service.get('smtp_host');
      expect(result).toBe('smtp.gmail.com');
    });

    it('retorna null quando chave não existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.get('chave_inexistente');
      expect(result).toBeNull();
    });
  });
});
