# Resumo: Deploy Agendaumento com Docker

Este documento resume todos os passos que fizemos para colocar o Agendaumento no ar.

---

## Arquitetura Final

```
Internet
    │
    ▼
https://agendaumento.couriersknowledge.com
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                          VPS                                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     Nginx                            │    │
│  │  - SSL/HTTPS (Certbot)                              │    │
│  │  - Serve frontend (arquivos estaticos)              │    │
│  │  - Proxy /api → localhost:3000                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                 │                                            │
│      ┌──────────┴──────────┐                                │
│      │                     │                                │
│      ▼                     ▼                                │
│  ~/frontend/           Docker                               │
│  index.html            ┌──────────────────────┐             │
│  *.js, *.css           │  API      │   DB     │             │
│                        │  Node.js  │ Postgres │             │
│                        │  :3000    │  :5432   │             │
│                        └──────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## Parte 1: Preparar o VPS

### 1.1 Criar usuario dedicado

```bash
# No VPS como root
adduser agendaumento
usermod -aG sudo agendaumento
usermod -aG docker agendaumento
```

### 1.2 Instalar Docker (se ainda nao tiver)

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Verificar
docker --version
docker compose version
```

---

## Parte 2: Estrutura do Projeto

```
agendaumento/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── clientes/
│   │   │   ├── pets/
│   │   │   ├── agendamentos/
│   │   │   └── ...
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── .env.example
└── deploy.ps1
```

---

## Parte 3: Arquivos de Configuracao

### 3.1 Dockerfile (backend/Dockerfile)

```dockerfile
FROM node:20-alpine

# Dependencias para sharp (processamento de imagem)
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Copiar package.json primeiro (melhor cache)
COPY package*.json ./

# Instalar dependencias
RUN npm install --omit=dev

# Copiar codigo
COPY . .

# Criar pasta de uploads
RUN mkdir -p /app/uploads

# Usuario non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
```

### 3.2 docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: ./backend
    container_name: agendaumento-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - agendaumento-network

  db:
    image: postgres:16-alpine
    container_name: agendaumento-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - agendaumento-network

volumes:
  postgres_data:

networks:
  agendaumento-network:
    driver: bridge
```

### 3.3 .env.example

```env
# Banco de dados
DB_USER=agendaumento
DB_PASSWORD=SenhaSegura123!
DB_NAME=agendaumento

# JWT
JWT_SECRET=chave-secreta-muito-longa-e-aleatoria
JWT_REFRESH_SECRET=outra-chave-secreta-muito-longa

# App
NODE_ENV=production
FRONTEND_URL=https://agendaumento.couriersknowledge.com
```

---

## Parte 4: Primeiro Deploy

### 4.1 Enviar arquivos para o VPS

```powershell
# No Windows (PowerShell)
scp -r ./backend/* agendaumento@76.13.69.251:~/agendaumento/backend/
scp ./docker-compose.yml agendaumento@76.13.69.251:~/agendaumento/
scp ./.env.example agendaumento@76.13.69.251:~/agendaumento/
```

### 4.2 Configurar .env no VPS

```bash
# No VPS
cd ~/agendaumento
cp .env.example .env
nano .env  # Editar com senhas reais
```

### 4.3 Subir containers

```bash
docker compose up -d --build
```

### 4.4 Verificar status

```bash
docker compose ps
docker compose logs -f
```

---

## Parte 5: Configurar Nginx

### 5.1 Criar configuracao

```bash
sudo nano /etc/nginx/sites-available/agendaumento
```

Conteudo:

```nginx
server {
    server_name agendaumento.couriersknowledge.com;

    # Frontend (Angular - arquivos estaticos)
    root /home/agendaumento/agendaumento/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API (Backend - Docker)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3000;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/agendaumento.couriersknowledge.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agendaumento.couriersknowledge.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name agendaumento.couriersknowledge.com;
    return 301 https://$host$request_uri;
}
```

### 5.2 Ativar site

```bash
sudo ln -s /etc/nginx/sites-available/agendaumento /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 Permissoes para Nginx acessar frontend

```bash
chmod 755 /home/agendaumento
chmod -R 755 /home/agendaumento/agendaumento/frontend
```

---

## Parte 6: SSL com Certbot

### 6.1 Instalar Certbot (se necessario)

```bash
sudo apt install certbot python3-certbot-nginx
```

### 6.2 Gerar certificado

```bash
sudo certbot --nginx -d agendaumento.couriersknowledge.com
```

---

## Parte 7: DNS (Porkbun)

1. Acessar painel do Porkbun
2. Ir em DNS do dominio
3. Adicionar registro:
   - **Type**: A
   - **Host**: agendaumento
   - **Answer**: 76.13.69.251
   - **TTL**: 600

---

## Parte 8: Deploy do Frontend

### 8.1 Build local

```powershell
cd frontend
npm run build
```

### 8.2 Enviar para VPS

```powershell
scp -r ./frontend/dist/agendaumento/browser/* agendaumento@76.13.69.251:~/agendaumento/frontend/
```

---

## Parte 9: Script de Deploy Automatizado

Usar o arquivo `deploy.ps1`:

```powershell
# Deploy completo (backend + frontend)
.\deploy.ps1 -m "descricao do que mudou"

# Apenas backend
.\deploy.ps1 -backend -m "fix: corrigido bug X"

# Apenas frontend
.\deploy.ps1 -frontend -m "feat: novo botao"
```

---

## Comandos Uteis

| Comando | Descricao |
|---------|-----------|
| `docker compose ps` | Ver status dos containers |
| `docker compose logs -f` | Ver logs em tempo real |
| `docker compose logs api` | Ver logs apenas da API |
| `docker compose down` | Parar containers |
| `docker compose up -d` | Iniciar containers |
| `docker compose up -d --build` | Rebuild e iniciar |
| `docker compose exec api sh` | Entrar no container da API |
| `docker compose exec db psql -U agendaumento` | Acessar banco |

---

## Checklist para Novo Projeto

- [ ] Criar usuario no VPS
- [ ] Instalar Docker no VPS
- [ ] Criar Dockerfile
- [ ] Criar docker-compose.yml
- [ ] Criar .env.example
- [ ] Configurar DNS (registro A)
- [ ] Configurar Nginx
- [ ] Gerar SSL com Certbot
- [ ] Ajustar permissoes das pastas
- [ ] Criar script de deploy
- [ ] Testar!

---

## Erros Comuns e Solucoes

| Erro | Causa | Solucao |
|------|-------|---------|
| `npm ci requires package-lock.json` | Dockerfile usa npm ci | Trocar para `npm install --omit=dev` |
| `Permission denied` no Nginx | Nginx nao acessa pasta do usuario | `chmod 755 /home/usuario` |
| `502 Bad Gateway` | Backend nao esta rodando | `docker compose logs api` |
| `.env nao encontrado` | Primeiro deploy | `cp .env.example .env && nano .env` |
| `Port already in use` | Outra app usando a porta | Verificar com `lsof -i :3000` |
