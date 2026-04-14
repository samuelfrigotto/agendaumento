const { body } = require('express-validator');

const agendamentoValidator = [
  body('petId')
    .notEmpty().withMessage('Pet e obrigatorio')
    .isUUID().withMessage('ID do pet invalido'),

  body('dataHora')
    .notEmpty().withMessage('Data e hora sao obrigatorios')
    .isISO8601().withMessage('Data e hora invalidos'),

  body('servicoId')
    .optional()
    .isUUID().withMessage('ID do servico invalido'),

  body('duracaoMin')
    .optional()
    .isInt({ min: 15, max: 480 }).withMessage('Duracao deve ser entre 15 e 480 minutos'),

  body('preco')
    .optional()
    .isFloat({ min: 0 }).withMessage('Preco deve ser um numero positivo'),

  body('observacoes')
    .optional()
    .trim()
];

module.exports = {
  agendamentoValidator
};
