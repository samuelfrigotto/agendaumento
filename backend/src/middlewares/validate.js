const { validationResult } = require('express-validator');

module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      erro: 'Dados inválidos.',
      detalhes: errors.array().map(e => ({ campo: e.path, mensagem: e.msg })),
    });
  }
  next();
};
