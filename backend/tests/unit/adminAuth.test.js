'use strict';

jest.mock('../../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../../src/config/database');
const service = require('../../src/modules/adminAuth/adminAuth.service');

const HASH_SENHA = bcrypt.hashSync('Admin@123', 10);

const ADMIN_ROW = {
  id: 1, nome: 'Admin 1', email: 'admin1@clinica.com',
  senha_hash: HASH_SENHA, ativo: true,
};

describe('adminAuth.service', () => {
  describe('login()', () => {
    it('retorna { token, admin } com credenciais corretas', async () => {
      pool.query.mockResolvedValueOnce({ rows: [ADMIN_ROW] });

      const result = await service.login('admin1@clinica.com', 'Admin@123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('admin');
      expect(result.admin).toEqual({
        id: 1,
        nome: 'Admin 1',
        email: 'admin1@clinica.com',
      });
      // Garante que senha_hash NÃO vazou na resposta
      expect(result.admin).not.toHaveProperty('senha_hash');

      // Token decodificável com role=admin
      const payload = jwt.decode(result.token);
      expect(payload.role).toBe('admin');
      expect(payload.id).toBe(1);
    });

    it('lança 401 se admin não encontrado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.login('nao@existe.com', 'qualquer'))
        .rejects.toMatchObject({ status: 401, message: 'Credenciais inválidas.' });
    });

    it('lança 401 se senha incorreta', async () => {
      pool.query.mockResolvedValueOnce({ rows: [ADMIN_ROW] });

      await expect(service.login('admin1@clinica.com', 'senhaerrada'))
        .rejects.toMatchObject({ status: 401, message: 'Credenciais inválidas.' });
    });
  });
});
