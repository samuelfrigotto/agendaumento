# Agendaumento

Sistema SaaS para agendamento de banho e tosa de pets.

## Stack

- **Backend**: Node.js + Express
- **Frontend**: Angular 21
- **Banco**: PostgreSQL 16
- **Infra**: Docker + Nginx + Certbot (SSL)

## Arquitetura

```
                    Internet
                        │
                        ▼
        https://agendaumento.couriersknowledge.com
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│                       VPS                              │
│                                                        │
│   ┌────────────────────────────────────────────────┐  │
│   │                   Nginx                         │  │
│   │  • SSL/HTTPS (Let's Encrypt)                   │  │
│   │  • Serve frontend (arquivos estaticos)         │  │
│   │  • Proxy reverso /api → localhost:3000         │  │
│   └────────────────────────────────────────────────┘  │
│                        │                               │
│         ┌──────────────┴──────────────┐               │
│         │                             │               │
│         ▼                             ▼               │
│   ~/frontend/                    Docker               │
│   (HTML, CSS, JS)         ┌─────────────────────┐    │
│                           │   API    │    DB    │    │
│                           │  :3000   │  :5432   │    │
│                           │ Node.js  │ Postgres │    │
│                           └─────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

## Decisoes Tecnicas

### Por que Docker?

- **Isolamento**: Cada servico roda em seu proprio container
- **Reproducibilidade**: Mesmo ambiente em dev e producao
- **Facilidade**: Um comando sobe tudo (`docker compose up`)

### Por que frontend fora do Docker?

- Angular compila para arquivos estaticos (HTML/CSS/JS)
- Nginx serve arquivos estaticos de forma muito eficiente
- Nao precisa de container extra = menos recursos

### Por que PostgreSQL?

- Suporte nativo a UUID (usado como primary key)
- JSONB para dados flexiveis
- Robusto e confiavel para producao

### Por que Node.js + Express?

- JavaScript no frontend e backend (mesma linguagem)
- Grande ecossistema de pacotes (npm)
- Async por padrao (bom para I/O)

## Como rodar localmente

### Pre-requisitos

- Node.js 20.19+
- Docker e Docker Compose
- Git

### Backend (com Docker)

```bash
# Clonar repositorio
git clone https://github.com/seu-usuario/agendaumento.git
cd agendaumento

# Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas configuracoes

# Subir containers
docker compose up -d

# Ver logs
docker compose logs -f

# Acessar API
curl http://localhost:3000/api/health
```

### Frontend (local)

```bash
cd frontend
npm install
npm start
# Acesse http://localhost:4200
```

## Deploy

### Automatizado (recomendado)

```powershell
# Deploy completo
.\deploy.ps1 -m "descricao da mudanca"

# Apenas backend
.\deploy.ps1 -backend

# Apenas frontend
.\deploy.ps1 -frontend
```

### Manual

```bash
# 1. Enviar arquivos
scp -r ./backend/* user@vps:~/agendaumento/backend/
scp ./docker-compose.yml user@vps:~/agendaumento/

# 2. No VPS: rebuild
cd ~/agendaumento
docker compose down
docker compose up -d --build
```

## Estrutura do Projeto

```
agendaumento/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, WhatsApp
│   │   ├── middlewares/     # Auth, error handling
│   │   ├── modules/         # Features (auth, clientes, pets, etc)
│   │   └── server.js        # Entry point
│   ├── migrations/          # SQL migrations
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Services, guards, interceptors
│   │   │   ├── features/    # Pages (agenda, clientes, etc)
│   │   │   └── shared/      # Components reutilizaveis
│   │   └── styles.scss
│   └── package.json
├── docker-compose.yml
├── deploy.ps1
├── .env.example
└── README.md
```

## Comandos Uteis

| Comando | Descricao |
|---------|-----------|
| `docker compose ps` | Ver status dos containers |
| `docker compose logs -f` | Ver logs em tempo real |
| `docker compose down` | Parar containers |
| `docker compose up -d --build` | Rebuild e iniciar |
| `docker compose exec db psql -U agendaumento` | Acessar banco |

## Endpoints da API

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/registro` | Criar conta |
| POST | `/api/auth/login` | Login |
| GET | `/api/clientes` | Listar clientes |
| GET | `/api/pets` | Listar pets |
| GET | `/api/agendamentos` | Listar agendamentos |
| GET | `/api/agendamentos/hoje` | Agendamentos de hoje |

## Licenca

Projeto privado - todos os direitos reservados.
