'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../../src/config/database');
const service = require('../../src/modules/clienteAuth/clienteAuth.service');

const HASH = bcrypt.hashSync('senha123', 10);
const CLIENTE_ROW = {
  id: 10, nome: 'João Silva', cpf: '12345678901',
  telefone: '11999999999', email: 'joao@email.com',
  senha_hash: HASH, ativo: true,
};

describe('clienteAuth.service', () => {
  describe('registrar()', () => {
    const PAYLOAD = {
      nome: 'João Silva', cpf: '123.456.789-01',
      telefone: '11999999999', senha: 'senha123',
      email: 'joao@email.com',
    };

    it('retorna { token, cliente } ao cadastrar novo cliente', async () => {
      // 1ª query: verifica duplicata → vazio
      pool.query.mockResolvedValueOnce({ rows: [] });
      // 2ª query: INSERT RETURNING
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 10, nome: 'João Silva', cpf: '12345678901', telefone: '11999999999', email: 'joao@email.com' }],
      });

      const result = await service.registrar(PAYLOAD);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('cliente');
      expect(result.cliente).toMatchObject({ id: 10, nome: 'João Silva', cpf: '12345678901' });
      expect(result.cliente).not.toHaveProperty('senha_hash');

      const payload = jwt.decode(result.token);
      expect(payload.role).toBe('cliente');
      expect(payload.id).toBe(10);
    });

    it('limpa máscara do CPF antes de salvar', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 11, nome: 'Ana', cpf: '98765432100', telefone: '11', email: null }] });

      await service.registrar({ nome: 'Ana', cpf: '987.654.321-00', telefone: '11', senha: '123456' });

      // Verifica que o CPF enviado ao BD é só dígitos
      const insertCall = pool.query.mock.calls[1];
      expect(insertCall[1][1]).toBe('98765432100');
    });

    it('lança 409 se CPF ou email já existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });

      await expect(service.registrar(PAYLOAD))
        .rejects.toMatchObject({ status: 409, message: 'CPF ou e-mail já cadastrado.' });
    });
  });

  describe('login()', () => {
    it('retorna { token, cliente } com CPF + senha corretos', async () => {
      pool.query.mockResolvedValueOnce({ rows: [CLIENTE_ROW] });

      const result = await service.login({ cpf: '123.456.789-01', senha: 'senha123' });

      expect(result).toHaveProperty('token');
      expect(result.cliente).toMatchObject({
        id: 10, nome: 'João Silva', cpf: '12345678901',
        email: 'joao@email.com', telefone: '11999999999',
      });
      expect(result.cliente).not.toHaveProperty('senha_hash');
    });

    it('retorna { token, cliente } com email + senha corretos', async () => {
      pool.query.mockResolvedValueOnce({ rows: [CLIENTE_ROW] });

      const result = await service.login({ email: 'joao@email.com', senha: 'senha123' });

      expect(result).toHaveProperty('token');
      expect(result.cliente.id).toBe(10);
    });

    it('lança 401 se cliente não encontrado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.login({ email: 'x@x.com', senha: 'abc' }))
        .rejects.toMatchObject({ status: 401, message: 'Credenciais inválidas.' });
    });

    it('lança 401 se senha incorreta', async () => {
      pool.query.mockResolvedValueOnce({ rows: [CLIENTE_ROW] });

      await expect(service.login({ cpf: '12345678901', senha: 'errada' }))
        .rejects.toMatchObject({ status: 401, message: 'Credenciais inválidas.' });
    });
  });

  describe('perfil()', () => {
    it('retorna dados do perfil sem senha_hash', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 10, nome: 'João Silva', cpf: '12345678901', telefone: '11999999999', endereco: 'Rua A', email: 'joao@email.com', criado_em: new Date() }],
      });

      const result = await service.perfil(10);

      expect(result).toMatchObject({ id: 10, nome: 'João Silva', cpf: '12345678901' });
      expect(result).not.toHaveProperty('senha_hash');
      expect(result).toHaveProperty('endereco');
      expect(result).toHaveProperty('criado_em');
    });

    it('lança 404 se cliente não existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.perfil(9999))
        .rejects.toMatchObject({ status: 404, message: 'Cliente não encontrado.' });
    });
  });
});
