const { body } = require('express-validator');

const clienteValidator = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 2, max: 150 }).withMessage('Nome deve ter entre 2 e 150 caracteres'),

  body('telefone')
    .trim()
    .notEmpty().withMessage('Telefone e obrigatorio')
    .matches(/^[\d\s\-\(\)\+]+$/).withMessage('Telefone invalido'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),

  body('observacoes')
    .optional()
    .trim()
];

module.exports = {
  clienteValidator
};
