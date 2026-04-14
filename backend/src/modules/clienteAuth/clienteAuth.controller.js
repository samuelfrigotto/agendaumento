const { validationResult } = require('express-validator');
const clienteAuthService = require('./clienteAuth.service');

const registro = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, email, senha, cpf, telefone } = req.body;

    const result = await clienteAuthService.registrar({
      nome,
      email,
      senha,
      cpf,
      telefone
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, senha } = req.body;

    const result = await clienteAuthService.login(email, senha);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token obrigatorio' });
    }

    const result = await clienteAuthService.refreshToken(refreshToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registro,
  login,
  refresh
};
