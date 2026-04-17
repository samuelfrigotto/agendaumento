const router    = require('express').Router();
const adminAuth = require('../../middlewares/adminAuth');
const ctrl      = require('./financeiro.controller');

router.use(adminAuth);

router.get('/resumo',   ctrl.resumo);
router.get('/servicos', ctrl.listarServicos);

module.exports = router;
