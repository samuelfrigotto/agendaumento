const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth');
const { upload } = require('../../middlewares/upload');
const petsController = require('./pets.controller');
const { petValidator } = require('./pets.validator');

router.use(auth);

router.get('/', petsController.listar);
router.post('/', petValidator, petsController.criar);
router.get('/:id', petsController.buscarPorId);
router.put('/:id', petValidator, petsController.atualizar);
router.delete('/:id', petsController.remover);
router.post('/:id/foto', upload.single('foto'), petsController.uploadFoto);

module.exports = router;
