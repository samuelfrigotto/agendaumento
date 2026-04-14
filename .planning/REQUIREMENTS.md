# Requirements: Agendaumento — Clínica Veterinária

**Defined:** 2026-04-14
**Core Value:** O cliente consegue agendar pelo celular em menos de 2 minutos, sem precisar ligar para a clínica.

## v1 Requirements

### Autenticação Admin

- [ ] **ADAUTH-01**: Admin faz login com e-mail e senha
- [ ] **ADAUTH-02**: Sessão do admin persiste via JWT

### Autenticação Cliente

- [ ] **CLAUTH-01**: Cliente cria conta com nome, e-mail e senha
- [ ] **CLAUTH-02**: Cliente faz login com e-mail e senha
- [ ] **CLAUTH-03**: Sessão do cliente persiste via JWT

### Pets

- [ ] **PET-01**: Cliente cadastra pet com nome, espécie, raça, data de nascimento, peso e observações
- [ ] **PET-02**: Cliente pode ter múltiplos pets cadastrados
- [ ] **PET-03**: Cliente pode editar dados do seu pet
- [ ] **PET-04**: Admin pode ver todos os pets e seu histórico de agendamentos

### Serviços

- [ ] **SRV-01**: Admin cadastra serviços com nome e duração (sem preço)
- [ ] **SRV-02**: Admin pode ativar/desativar serviços
- [ ] **SRV-03**: Cliente vê o catálogo de serviços disponíveis ao agendar

### Disponibilidade

- [ ] **DISP-01**: Admin define horários disponíveis por dia da semana (ex: seg-sex 08:00-18:00, sáb 08:00-12:00)
- [ ] **DISP-02**: Admin bloqueia datas e intervalos específicos (feriados, férias)
- [ ] **DISP-03**: Sistema gera slots disponíveis com base na disponibilidade e duração do serviço, excluindo agendamentos existentes

### Agendamento (Cliente)

- [ ] **AG-01**: Cliente seleciona serviço, data e horário disponível
- [ ] **AG-02**: Cliente seleciona qual pet será atendido
- [ ] **AG-03**: Confirmação do agendamento é instantânea (sem aprovação do admin)
- [ ] **AG-04**: Cliente vê seus agendamentos futuros
- [ ] **AG-05**: Cliente pode cancelar agendamento com antecedência mínima configurável

### Agenda (Admin)

- [ ] **AGAD-01**: Admin visualiza agenda do dia com todos os agendamentos
- [ ] **AGAD-02**: Admin visualiza agenda da semana
- [ ] **AGAD-03**: Admin pode cancelar um agendamento
- [ ] **AGAD-04**: Admin pode remarcar um agendamento para outro horário disponível

### Notificações

- [ ] **NOTIF-01**: Cliente recebe e-mail de confirmação ao agendar
- [ ] **NOTIF-02**: Admin recebe e-mail quando um novo agendamento é feito
- [ ] **NOTIF-03**: Cliente recebe mensagem WhatsApp de confirmação ao agendar
- [ ] **NOTIF-04**: Admin recebe mensagem WhatsApp quando um novo agendamento é feito

### Infraestrutura

- [ ] **INFRA-01**: Backend Node.js + Express dockerizado rodando na VPS
- [ ] **INFRA-02**: Frontend Angular compilado e servido pelo Nginx
- [ ] **INFRA-03**: Banco PostgreSQL em container Docker
- [ ] **INFRA-04**: HTTPS via Let's Encrypt + Certbot

## v2 Requirements

### Lembretes

- **LEM-01**: Cliente recebe lembrete 24h antes do agendamento (WhatsApp/e-mail)
- **LEM-02**: Admin recebe resumo do dia na manhã de cada dia com agendamentos

### Perfil do cliente

- **PERF-01**: Cliente pode editar seu nome e telefone
- **PERF-02**: Cliente pode alterar sua senha

### Relatórios

- **REL-01**: Admin vê relatório mensal de agendamentos por serviço

## Out of Scope

| Feature | Reason |
|---------|--------|
| Pagamento online | Orçamento tratado presencialmente — preço varia por porte/raça |
| Multi-profissional | Uma agenda única, sem escolha de veterinário |
| Prontuário médico | Sistema de agendamento, não gestão clínica completa |
| Multi-clínica / SaaS | Sistema específico para uma clínica |
| App nativo iOS/Android | Web mobile-first é suficiente |
| Login social (Google, Facebook) | Email/senha suficiente para v1 |
| Chat/mensagens internas | Fora do escopo de agendamento |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ADAUTH-01, ADAUTH-02 | Phase 1 | Pending |
| CLAUTH-01, CLAUTH-02, CLAUTH-03 | Phase 1 | Pending |
| INFRA-01, INFRA-02, INFRA-03, INFRA-04 | Phase 1 | Pending |
| PET-01, PET-02, PET-03 | Phase 2 | Pending |
| SRV-01, SRV-02, SRV-03 | Phase 2 | Pending |
| DISP-01, DISP-02, DISP-03 | Phase 3 | Pending |
| AG-01, AG-02, AG-03, AG-04, AG-05 | Phase 4 | Pending |
| AGAD-01, AGAD-02, AGAD-03, AGAD-04 | Phase 4 | Pending |
| NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04 | Phase 5 | Pending |
| PET-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after initial definition*
