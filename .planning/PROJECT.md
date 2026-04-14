# Agendaumento — Clínica Veterinária

## What This Is

Sistema de agendamento online para uma clínica veterinária com dois lados: um painel admin onde a clínica controla a agenda, e uma área pública mobile-first onde o cliente cria conta, seleciona serviço, dia e horário, cadastra seu pet e agenda remotamente. A confirmação é instantânea e o cliente/admin recebem notificação via WhatsApp e e-mail.

## Core Value

O cliente consegue agendar pelo celular em menos de 2 minutos, sem precisar ligar para a clínica.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Cliente pode criar conta e fazer login
- [ ] Cliente pode cadastrar um ou mais pets com dados completos (nome, espécie, raça, idade, peso, observações)
- [ ] Cliente pode ver os serviços disponíveis e selecionar um
- [ ] Cliente pode escolher dia e horário disponíveis e confirmar o agendamento instantaneamente
- [ ] Cliente recebe confirmação via WhatsApp e e-mail ao agendar
- [ ] Cliente pode ver seus agendamentos (próximos e histórico)
- [ ] Admin pode fazer login com credenciais separadas
- [ ] Admin pode visualizar a agenda do dia e da semana
- [ ] Admin pode definir os horários disponíveis para agendamento
- [ ] Admin pode bloquear datas e horários específicos (feriados, férias, etc.)
- [ ] Admin pode cancelar ou remarcar agendamentos existentes
- [ ] Admin pode ver o histórico de agendamentos por pet
- [ ] Admin pode gerenciar o catálogo de serviços (nome, duração)
- [ ] Admin recebe notificação via WhatsApp e e-mail quando um novo agendamento é feito

### Out of Scope

- Pagamento online — orçamento é tratado presencialmente
- Multi-profissional — apenas um veterinário, agenda única
- Prontuário médico completo — o sistema é de agendamento, não de gestão clínica
- Multi-clínica / SaaS — sistema feito para uma clínica específica
- App nativo (iOS/Android) — web mobile-first é suficiente

## Context

Projeto greenfield utilizando a mesma stack de um projeto anterior de agendamento para banho e tosa. O código anterior está sendo descartado; apenas a infraestrutura de deploy (deploy.ps1, docker-compose.yml, .env) está sendo reutilizada.

Deploy em VPS com Nginx + Let's Encrypt. Backend em Docker, frontend servido como arquivos estáticos pelo Nginx.

## Constraints

- **Tech Stack**: Node.js + Express (backend), Angular (frontend), PostgreSQL, Docker + Nginx — mantém consistência com a infra de deploy existente
- **Mobile-first**: Interface do cliente otimizada para celular — critério central de UX
- **Single vet**: Apenas um profissional na clínica, sem seleção de atendente

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Confirmação instantânea (sem aprovação admin) | Reduz fricção para o cliente e carga de trabalho do admin | — Pending |
| WhatsApp + e-mail como notificações | Canal preferido pelos clientes de pet shops/clínicas no Brasil | — Pending |
| Login obrigatório para clientes | Permite histórico de pets e agendamentos, melhora experiência recorrente | — Pending |
| Preço fora do sistema | Serviços variam por porte/raça; orçamento presencial evita expectativas erradas | — Pending |

## Evolution

Este documento evolui nas transições de fase e marcos de milestone.

**Após cada fase** (via `/gsd-transition`):
1. Requisitos invalidados? → Mover para Out of Scope com motivo
2. Requisitos validados? → Mover para Validated com referência de fase
3. Novos requisitos emergiram? → Adicionar em Active
4. Decisões a registrar? → Adicionar em Key Decisions
5. "What This Is" ainda preciso? → Atualizar se drifted

**Após cada milestone** (via `/gsd-complete-milestone`):
1. Revisão completa de todas as seções
2. Check do Core Value — ainda a prioridade certa?
3. Auditar Out of Scope — motivos ainda válidos?
4. Atualizar Context com o estado atual

---
*Last updated: 2026-04-14 after initialization*
