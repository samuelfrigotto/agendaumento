const express = require('express');
const router = express.Router();
const { clientAuth } = require('../../middlewares/clientAuth');
const clienteAreaController = require('./clienteArea.controller');
const {
  criarAgendamentoValidator,
  criarPetValidator,
  atualizarPerfilValidator
} = require('./clienteArea.validator');

// Todas as rotas requerem autenticacao de cliente
router.use(clientAuth);

// Agendamentos
router.get('/agendamentos', clienteAreaController.listarAgendamentos);
router.post('/agendamentos', criarAgendamentoValidator, clienteAreaController.criarAgendamento);
router.delete('/agendamentos/:id', clienteAreaController.cancelarAgendamento);

// Pets
router.get('/pets', clienteAreaController.listarPets);
router.post('/pets', criarPetValidator, clienteAreaController.criarPet);

// Perfil
router.get('/perfil', clienteAreaController.obterPerfil);
router.put('/perfil', atualizarPerfilValidator, clienteAreaController.atualizarPerfil);

module.exports = router;
