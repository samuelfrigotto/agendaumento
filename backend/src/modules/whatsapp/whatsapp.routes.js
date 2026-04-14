const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth');
const whatsappController = require('./whatsapp.controller');

router.use(auth);

router.get('/status', whatsappController.getStatus);
router.post('/enviar-custom', whatsappController.enviarCustom);

module.exports = router;
