const { body } = require('express-validator');

const petValidator = [
  body('clienteId')
    .notEmpty().withMessage('Cliente e obrigatorio')
    .isUUID().withMessage('ID do cliente invalido'),

  body('nome')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 1, max: 100 }).withMessage('Nome deve ter entre 1 e 100 caracteres'),

  body('especie')
    .optional()
    .trim()
    .isIn(['cachorro', 'gato', 'outro']).withMessage('Especie invalida'),

  body('raca')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Raca deve ter no maximo 100 caracteres'),

  body('tamanho')
    .optional()
    .trim()
    .isIn(['pequeno', 'medio', 'grande', 'gigante']).withMessage('Tamanho invalido'),

  body('pesoKg')
    .optional()
    .isFloat({ min: 0, max: 200 }).withMessage('Peso deve ser um numero entre 0 e 200'),

  body('observacoes')
    .optional()
    .trim()
];

module.exports = {
  petValidator
};
