const { body } = require('express-validator');

const criarValidator = [
  body('especie')
    .trim()
    .notEmpty().withMessage('Especie e obrigatoria')
    .isLength({ max: 50 }).withMessage('Especie deve ter no maximo 50 caracteres'),

  body('raca')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Raca deve ter no maximo 100 caracteres')
];

const atualizarValidator = [
  body('especie')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Especie deve ter no maximo 50 caracteres'),

  body('raca')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Raca deve ter no maximo 100 caracteres'),

  body('ativo')
    .optional()
    .isBoolean().withMessage('Ativo deve ser true ou false')
];

module.exports = {
  criarValidator,
  atualizarValidator
};
