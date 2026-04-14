const { body } = require('express-validator');

const registroValidator = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 2, max: 150 }).withMessage('Nome deve ter entre 2 e 150 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email e obrigatorio')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),

  body('senha')
    .notEmpty().withMessage('Senha e obrigatoria')
    .isLength({ min: 6 }).withMessage('Senha deve ter no minimo 6 caracteres'),

  body('telefone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\(\)\+]+$/).withMessage('Telefone invalido'),

  body('nomeNegocio')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Nome do negocio deve ter no maximo 200 caracteres')
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email e obrigatorio')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),

  body('senha')
    .notEmpty().withMessage('Senha e obrigatoria')
];

module.exports = {
  registroValidator,
  loginValidator
};
