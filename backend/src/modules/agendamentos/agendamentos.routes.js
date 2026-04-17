const router      = require('express').Router();
const { body }    = require('express-validator');
const validate    = require('../../middlewares/validate');
const adminAuth   = require('../../middlewares/adminAuth');
const clienteAuth = require('../../middlewares/clienteAuth');
const ctrl        = require('./agendamentos.controller');

// ── Admin ──────────────────────────────────────────────
router.get('/admin',          adminAuth, ctrl.listar);
router.get('/admin/agenda',   adminAuth, ctrl.agenda);
router.get('/admin/:id',      adminAuth, ctrl.buscarPorId);
router.post('/admin',         adminAuth,
  body('servicoId').isInt({ min: 1 }),
  body('dataHora').isISO8601(),
  validate,
  ctrl.criarAdmin
);
router.patch('/admin/:id/status', adminAuth,
  body('status').isIn(['pendente','confirmado','concluido','cancelado']),
  validate,
  ctrl.atualizarStatus
);

// ── Cliente ────────────────────────────────────────────
router.get('/meus',           clienteAuth, ctrl.meus);
router.post('/',              clienteAuth,
  body('petId').isInt({ min: 1 }),
  body('servicoId').isInt({ min: 1 }),
  body('dataHora').isISO8601(),
  validate,
  ctrl.criarCliente
);
router.patch('/:id/cancelar', clienteAuth, ctrl.cancelarCliente);

module.exports = router;
