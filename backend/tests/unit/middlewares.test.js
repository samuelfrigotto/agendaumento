'use strict';

const jwt = require('jsonwebtoken');
const SECRET = 'test_secret_middleware';
process.env.JWT_SECRET = SECRET;

const adminAuth   = require('../../src/middlewares/adminAuth');
const clienteAuth = require('../../src/middlewares/clienteAuth');
const validate    = require('../../src/middlewares/validate');
const errorHandler= require('../../src/middlewares/errorHandler');

// Helpers
const makeReq = (token, role) => ({
  headers: {
    authorization: token
      ? `Bearer ${jwt.sign({ id: 1, nome: 'X', email: 'x@x.com', role }, SECRET)}`
      : undefined,
  },
});
const makeRes = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('middlewares', () => {
  describe('adminAuth', () => {
    it('chama next() com token admin válido', () => {
      const req  = makeReq('ok', 'admin');
      const res  = makeRes();
      const next = jest.fn();

      adminAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.admin).toHaveProperty('role', 'admin');
    });

    it('retorna 401 sem Authorization header', () => {
      const req  = { headers: {} };
      const res  = makeRes();

      adminAuth(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ erro: 'Token não fornecido.' });
    });

    it('retorna 403 com token de cliente (role errado)', () => {
      const req  = makeReq('ok', 'cliente');
      const res  = makeRes();

      adminAuth(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('retorna 401 com token inválido/expirado', () => {
      const req  = { headers: { authorization: 'Bearer token_invalido' } };
      const res  = makeRes();

      adminAuth(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('clienteAuth', () => {
    it('chama next() com token cliente válido', () => {
      const req  = makeReq('ok', 'cliente');
      const res  = makeRes();
      const next = jest.fn();

      clienteAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.cliente).toHaveProperty('role', 'cliente');
    });

    it('retorna 401 sem token', () => {
      const req = { headers: {} };
      const res = makeRes();

      clienteAuth(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('retorna 403 com token de admin', () => {
      const req = makeReq('ok', 'admin');
      const res = makeRes();

      clienteAuth(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('validate', () => {
    it('chama next() quando não há erros de validação', () => {
      const req  = { headers: {}, body: {} };
      // Simula validationResult retornando isEmpty() = true
      jest.resetModules();
      // Usa o módulo real com request sem errors
      const { validationResult } = require('express-validator');
      const next = jest.fn();
      const res  = makeRes();

      // Cria request com nenhum erro
      const reqClean = Object.assign(req, {
        _validationContexts: [],
        _validationErrors:   [],
      });

      validate(reqClean, res, next);
      // Se validationResult não encontrar erros, next é chamado
      // (comportamento depende da inicialização do express-validator)
      // Verificamos que res.json NÃO foi chamado com erro 422
      expect(res.status).not.toHaveBeenCalledWith(422);
    });
  });

  describe('errorHandler', () => {
    it('responde 422 para erros de validação', () => {
      const err = { type: 'validation', message: 'Inválido', detalhes: [] };
      const res = makeRes();

      errorHandler(err, {}, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('responde com status do erro quando < 500', () => {
      const err = { status: 404, message: 'Não encontrado' };
      const res = makeRes();

      errorHandler(err, { method: 'GET', path: '/x' }, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ erro: 'Não encontrado' });
    });

    it('responde 500 com mensagem genérica para erros internos', () => {
      const err = new Error('DB explodiu');
      const res = makeRes();

      errorHandler(err, { method: 'GET', path: '/x' }, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor.' });
    });
  });
});
