const { body } = require('express-validator');

const servicoValidator = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 2, max: 150 }).withMessage('Nome deve ter entre 2 e 150 caracteres'),

  body('duracaoMin')
    .notEmpty().withMessage('Duracao e obrigatoria')
    .isInt({ min: 15, max: 480 }).withMessage('Duracao deve ser entre 15 e 480 minutos'),

  body('precoPequeno')
    .optional()
    .isFloat({ min: 0 }).withMessage('Preco deve ser um numero positivo'),

  body('precoMedio')
    .optional()
    .isFloat({ min: 0 }).withMessage('Preco deve ser um numero positivo'),

  body('precoGrande')
    .optional()
    .isFloat({ min: 0 }).withMessage('Preco deve ser um numero positivo'),

  body('precoGigante')
    .optional()
    .isFloat({ min: 0 }).withMessage('Preco deve ser um numero positivo'),

  body('ativo')
    .optional()
    .isBoolean().withMessage('Ativo deve ser true ou false')
];

module.exports = {
  servicoValidator
};
