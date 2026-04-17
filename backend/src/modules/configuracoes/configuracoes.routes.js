const router    = require('express').Router();
const adminAuth = require('../../middlewares/adminAuth');
const ctrl      = require('./configuracoes.controller');

// Public — returns only clinic display info (no auth required)
router.get('/publico', ctrl.listarPublico);

// Protected
router.use(adminAuth);
router.get('/',  ctrl.listar);
router.put('/',  ctrl.salvar);

module.exports = router;
