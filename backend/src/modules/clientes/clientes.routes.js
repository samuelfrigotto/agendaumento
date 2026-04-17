const router    = require('express').Router();
const adminAuth = require('../../middlewares/adminAuth');
const ctrl      = require('./clientes.controller');

router.use(adminAuth);

router.get('/',             ctrl.listar);
router.get('/:id',          ctrl.buscarPorId);
router.get('/:id/pets',     ctrl.pets);
router.delete('/:id',       ctrl.desativar);

module.exports = router;
