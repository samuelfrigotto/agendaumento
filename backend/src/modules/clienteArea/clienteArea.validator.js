const { body } = require('express-validator');

const criarAgendamentoValidator = [
  body('petId')
    .notEmpty().withMessage('Pet e obrigatorio')
    .isUUID().withMessage('ID do pet invalido'),

  body('servicoId')
    .notEmpty().withMessage('Servico e obrigatorio')
    .isUUID().withMessage('ID do servico invalido'),

  body('dataHora')
    .notEmpty().withMessage('Data e hora sao obrigatorios')
    .isISO8601().withMessage('Data e hora invalidos'),

  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Observacoes deve ter no maximo 500 caracteres')
];

const criarPetValidator = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),

  body('especie')
    .optional()
    .trim()
    .isIn(['cachorro', 'gato']).withMessage('Especie deve ser cachorro ou gato'),

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
    .isFloat({ min: 0.1, max: 200 }).withMessage('Peso deve ser entre 0.1 e 200 kg'),

  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Observacoes deve ter no maximo 500 caracteres')
];

const atualizarPerfilValidator = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Nome deve ter entre 2 e 150 caracteres'),

  body('telefone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\(\)\+]+$/).withMessage('Telefone invalido')
];

module.exports = {
  criarAgendamentoValidator,
  criarPetValidator,
  atualizarPerfilValidator
};
