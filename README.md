PLANO TÉCNICO — Agendaumento
============================================================

ESCOPO
  Descrição : Sistema de agendamento de serviços para clínica veterinária
  Complexidade : 1/5 (Protótipo rápido)
  SLA esperado : 99%
  Esforço estimado : 2 dia(s)

ESCALA & TRÁFEGO
  Clientes/dia : 50
  Usuários simultâneos : 10
  Pico de tráfego : 3×
  Tamanho do banco : 2/5 (1k–100k)
  Crescimento esperado : estável
  Multi-tenant : não
  LGPD/GDPR : não agora

STACK
  Linguagem : Node
  Framework : Express
  Banco de dados : PostgreSQL
  Cache : Nenhum
  Hospedagem : Railway

API & COMUNICAÇÃO
  Tipo : REST
  Versionamento : não
  Paginação : sim
  Rate limiting : sim

AUTENTICAÇÃO & SEGURANÇA
  Auth : JWT
  Roles : admin, user
  2FA : não
  CORS : sim
  HTTPS/Helmet : sim
  Validação de entrada : sim
  Proteção SQLi/XSS : sim
  IP Whitelist : não

INFRAESTRUTURA & DEPLOY
  CI/CD : Nenhum
  Ambientes : prod
  Docker : sim

DADOS & ARMAZENAMENTO
  Backup : Semanal
  Armazenamento de arquivos : Nenhum
  Migrations : sim

OBSERVABILIDADE
  Logs : Console
  Monitoramento : Nenhum
  Sentry : não
  Alertas : não

RECURSOS EXTRAS
  Filas/Workers : não
  WebSockets : não
  i18n : não
  Notificações : E-mail, WhatsApp
  Recursos técnicos ativos : CORS, HTTPS/Helmet, Validação, Migrations, Docker, Rate Limiting

============================================================
FUNCIONALIDADES & NECESSIDADES DO PROJETO

Para esse projeto eu preciso de 2 visões diferentes, um login para usuários, e um login e painel de controle para o admin, mas o do admin sem opção de cadastro, apenas com 3 contas de admin já pré setadas no banco de dados. Como é um projeto mais simples a parte do admin vai ficar oculta no www.admin.aquivaimeusite.com/login, e depois do login o admin deve ter as seguintes funções:

- ver os clientes cadastrados
- ver os pets cadastrados de cada cliente
- ver uma agenda com os serviços semanais já solicitados pelos clientes
- ter a opção de marcar serviços por fora do site
- ter a opção de configurar horários disponíveis para os clientes solicitarem os serviços
- ver em uma aba financeira os serviços solicitados, e ter a opção de marcar como concluído ou cancelado
- ver uma tela para cadastrar os serviços disponíveis e os pets que podem ser atendidos
- ver uma aba de configurações para configurar SMTP do email e WhatsApp

Já na parte do usuário:
- página inicial com agendamento, mesmo sem login
- cadastro do pet
- login e registro com nome completo, CPF, telefone, endereço e senha

Sistema de notificações lembrando o usuário no dia e 2 horas antes do serviço.
============================================================