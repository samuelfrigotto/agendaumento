const router    = require('express').Router();
const adminAuth = require('../../middlewares/adminAuth');
const ctrl      = require('./configuracoes.controller');

router.use(adminAuth);

router.get('/',  ctrl.listar);
router.put('/',  ctrl.salvar);

module.exports = router;
