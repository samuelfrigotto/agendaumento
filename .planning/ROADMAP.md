# Roadmap: Agendaumento — Clínica Veterinária

**Milestone:** v1.0 — Sistema de Agendamento Online
**Goal:** Cliente agenda pelo celular em menos de 2 minutos, sem ligar para a clínica.

---

## Phase 1: Fundação e Autenticação

**Goal:** Projeto configurado do zero com autenticação funcional para admin e cliente.

### Plans

1. **Scaffold do projeto** — Estrutura de pastas, banco de dados, migrations iniciais, Docker Compose configurado, variáveis de ambiente
2. **Auth admin** — Registro/login de admin via JWT, middleware de proteção de rotas admin
3. **Auth cliente** — Registro/login de cliente via JWT, middleware de proteção de rotas cliente, guard no Angular
4. **Frontend base** — Angular com rotas configuradas, layouts separados (admin/cliente), interceptors de auth, telas de login/registro para ambos

**Requirements:** ADAUTH-01, ADAUTH-02, CLAUTH-01, CLAUTH-02, CLAUTH-03, INFRA-01, INFRA-02, INFRA-03

---

## Phase 2: Pets e Serviços

**Goal:** Admin gerencia o catálogo de serviços; cliente cadastra e gerencia seus pets.

### Plans

1. **CRUD de serviços (admin)** — API + tela admin para criar, editar, ativar/desativar serviços com nome e duração
2. **CRUD de pets (cliente)** — API + tela cliente para cadastrar, listar e editar pets (nome, espécie, raça, data de nascimento, peso, observações)
3. **Visão de pets (admin)** — Tela admin para listar todos os pets cadastrados com dados do dono

**Requirements:** SRV-01, SRV-02, SRV-03, PET-01, PET-02, PET-03, PET-04

---

## Phase 3: Disponibilidade e Slots

**Goal:** Admin configura quando a clínica atende; sistema gera os horários disponíveis corretamente.

### Plans

1. **Configuração de disponibilidade semanal** — API + tela admin para definir horários de funcionamento por dia da semana
2. **Bloqueio de datas** — API + tela admin para bloquear datas específicas e intervalos (feriados, férias)
3. **Motor de slots** — Lógica backend para gerar slots disponíveis: disponibilidade semanal - bloqueios - agendamentos existentes - duração do serviço; endpoint público de consulta

**Requirements:** DISP-01, DISP-02, DISP-03

---

## Phase 4: Agendamento e Agenda

**Goal:** Cliente agenda pelo celular; admin visualiza e gerencia a agenda completa.

### Plans

1. **Fluxo de agendamento (cliente, mobile-first)** — Tela Angular: selecionar serviço → escolher data no calendário → escolher horário disponível → selecionar pet → confirmar; API de criação de agendamento com lock para evitar double-booking
2. **Meus agendamentos (cliente)** — Tela com agendamentos futuros e histórico; cancelamento de agendamento com antecedência mínima
3. **Agenda do admin — dia e semana** — Tela admin com visão de dia/semana dos agendamentos, detalhes de cada slot
4. **Gestão de agendamentos (admin)** — Cancelar e remarcar agendamentos; visão de histórico por pet

**Requirements:** AG-01, AG-02, AG-03, AG-04, AG-05, AGAD-01, AGAD-02, AGAD-03, AGAD-04

---

## Phase 5: Notificações

**Goal:** Cliente e admin recebem confirmações automáticas via e-mail e WhatsApp.

### Plans

1. **Notificações por e-mail** — Nodemailer configurado; templates de confirmação para cliente e admin disparados após agendamento
2. **Notificações WhatsApp** — Integração com API WhatsApp (Evolution API ou Z-API); mensagem de confirmação para cliente e admin
3. **Notificações de cancelamento** — E-mail e WhatsApp para cliente quando agendamento é cancelado (por ele ou pelo admin)

**Requirements:** NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04

---

## Phase 6: Polish e Deploy

**Goal:** Sistema estável, seguro e rodando em produção.

### Plans

1. **Validações e tratamento de erros** — Validação de formulários no frontend, mensagens de erro claras, edge cases do fluxo de agendamento
2. **UX mobile** — Revisão da experiência no celular: toque, scroll, calendário, loading states, feedback visual
3. **Deploy em produção** — Build do Angular, configuração Nginx, containers Docker na VPS, HTTPS via Certbot, variáveis de ambiente de produção
4. **Testes de ponta a ponta** — Smoke tests do fluxo crítico: registro → cadastro de pet → agendamento → notificação

**Requirements:** INFRA-04 + polish geral

---

## Summary

| Phase | Goal | Requirements |
|-------|------|--------------|
| 1: Fundação e Auth | Projeto do zero com auth dual | 8 reqs |
| 2: Pets e Serviços | Catálogo e cadastro de pets | 7 reqs |
| 3: Disponibilidade | Slots gerados corretamente | 3 reqs |
| 4: Agendamento | Fluxo completo cliente + agenda admin | 9 reqs |
| 5: Notificações | WhatsApp + e-mail automáticos | 4 reqs |
| 6: Polish e Deploy | Produção estável | INFRA-04 |

**Total v1:** 27 requirements → 6 phases → ~22 plans

---

## After v1

Referência para planejamento do próximo milestone (v2):
- Lembretes 24h antes (WhatsApp/e-mail)
- Resumo matinal para admin
- Edição de perfil do cliente
- Relatório mensal de agendamentos

---
*Roadmap created: 2026-04-14*
*Next step: `/gsd-plan-phase 1`*
