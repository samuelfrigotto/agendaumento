const router    = require('express').Router();
const { body }  = require('express-validator');
const validate  = require('../../middlewares/validate');
const adminAuth = require('../../middlewares/adminAuth');
const ctrl      = require('./tiposAnimais.controller');

// Leitura pública (usada no formulário de agendamento)
router.get('/', ctrl.listar);

// Escrita: somente admin
router.post('/',     adminAuth, body('nome').trim().notEmpty(), validate, ctrl.criar);
router.patch('/:id', adminAuth, ctrl.atualizar);
router.delete('/:id',adminAuth, ctrl.remover);

module.exports = router;
