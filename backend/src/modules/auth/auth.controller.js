const { validationResult } = require('express-validator');
const authService = require('./auth.service');

const registro = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, email, senha, telefone, nomeNegocio } = req.body;

    const result = await authService.registrar({
      nome,
      email,
      senha,
      telefone,
      nomeNegocio
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

    const result = await authService.login(email, senha);

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

    const result = await authService.refreshToken(refreshToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const esqueciSenha = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email obrigatorio' });
    }

    await authService.esqueciSenha(email);

    res.json({ message: 'Se o email existir, voce recebera instrucoes de recuperacao' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registro,
  login,
  refresh,
  esqueciSenha
};
