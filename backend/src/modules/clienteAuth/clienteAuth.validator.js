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

  body('cpf')
    .trim()
    .notEmpty().withMessage('CPF e obrigatorio')
    .matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/).withMessage('CPF invalido')
    .customSanitizer(value => value.replace(/[^\d]/g, '')),

  body('telefone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\(\)\+]+$/).withMessage('Telefone invalido')
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
