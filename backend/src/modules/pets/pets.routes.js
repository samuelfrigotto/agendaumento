const router      = require('express').Router();
const { body }    = require('express-validator');
const validate    = require('../../middlewares/validate');
const clienteAuth = require('../../middlewares/clienteAuth');
const ctrl        = require('./pets.controller');

router.use(clienteAuth);

router.get('/',     ctrl.listar);
router.post('/',
  body('tipo_animal_id').isInt({ min: 1 }).withMessage('Tipo de animal inválido.'),
  body('nome').trim().notEmpty().withMessage('Nome do pet obrigatório.'),
  validate,
  ctrl.criar
);
router.patch('/:id',  ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;
