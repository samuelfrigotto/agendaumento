# Guia Completo: VPS + Docker para Iniciantes

> Autor: Aprendizado de Cloud Engineering
> Data: Abril 2026
> VPS: Debian (Trixie)

---

## Indice

1. [Conceitos Basicos](#1-conceitos-basicos)
2. [Acesso ao VPS](#2-acesso-ao-vps)
3. [Instalacao do Docker](#3-instalacao-do-docker)
4. [Criacao de Usuario para Docker](#4-criacao-de-usuario-para-docker)
5. [Primeiros Containers](#5-primeiros-containers)
6. [Docker Compose](#6-docker-compose)
7. [Nginx como Proxy Reverso](#7-nginx-como-proxy-reverso)
8. [Comandos de Referencia](#8-comandos-de-referencia)

---

## 1. Conceitos Basicos

### O que e um VPS?
Virtual Private Server - um servidor virtual que voce aluga. E como ter um computador Linux rodando 24/7 na nuvem.

### O que e Docker?
Ferramenta para rodar aplicacoes em **containers** - ambientes isolados que contem tudo que a aplicacao precisa.

### Container vs Maquina Virtual
```
Maquina Virtual:
┌─────────────────┐
│   Sua App       │
├─────────────────┤
│   Sistema Op.   │  ← SO completo (pesado)
├─────────────────┤
│   Hypervisor    │
├─────────────────┤
│   Hardware      │
└─────────────────┘

Container Docker:
┌─────────────────┐
│   Sua App       │
├─────────────────┤
│   Container     │  ← Apenas libs necessarias (leve)
├─────────────────┤
│   Docker Engine │
├─────────────────┤
│   Sistema Op.   │  ← Compartilhado
└─────────────────┘
```

### Anatomia de um comando Docker
```bash
docker run -d -p 8080:80 --name meu-nginx nginx
│      │   │  │         │               │
│      │   │  │         │               └── Imagem (o que rodar)
│      │   │  │         └── Nome do container
│      │   │  └── Porta host:container
│      │   └── Detached (rodar em background)
│      └── Acao (run, stop, rm, etc)
└── Comando principal
```

---

## 2. Acesso ao VPS

### Conectar via SSH
```bash
ssh usuario@ip-do-servidor
```

**Exemplo:**
```bash
ssh root@76.13.69.251
```

### Primeiro acesso (atualizar sistema)
```bash
apt update && apt upgrade -y
```

**O que faz:**
- `apt update` - Atualiza a lista de pacotes disponiveis
- `apt upgrade -y` - Instala atualizacoes (-y = sem perguntar)
- `&&` - Executa o segundo comando apenas se o primeiro der certo

---

## 3. Instalacao do Docker

### Passo 3.1: Instalar dependencias
```bash
apt install -y ca-certificates curl gnupg
```

| Pacote | Para que serve |
|--------|----------------|
| `ca-certificates` | Certificados SSL (conexoes HTTPS) |
| `curl` | Baixar arquivos da internet |
| `gnupg` | Verificar autenticidade de pacotes |

### Passo 3.2: Criar pasta para chaves
```bash
install -m 0755 -d /etc/apt/keyrings
```

| Parte | Significado |
|-------|-------------|
| `install` | Comando para criar com permissoes |
| `-m 0755` | Permissoes rwxr-xr-x |
| `-d` | Criar diretorio |

### Passo 3.3: Baixar chave GPG do Docker
```bash
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

| Parte | Significado |
|-------|-------------|
| `curl -fsSL` | Baixar silenciosamente, seguir redirects |
| `\|` | Pipe - passa saida para proximo comando |
| `gpg --dearmor` | Converte texto para binario |
| `-o arquivo` | Onde salvar |

### Passo 3.4: Dar permissao de leitura
```bash
chmod a+r /etc/apt/keyrings/docker.gpg
```

### Passo 3.5: Adicionar repositorio Docker
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**Verificar se funcionou:**
```bash
cat /etc/apt/sources.list.d/docker.list
```

### Passo 3.6: Instalar Docker
```bash
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

| Pacote | Para que serve |
|--------|----------------|
| `docker-ce` | Docker Community Edition (principal) |
| `docker-ce-cli` | Comandos de terminal |
| `containerd.io` | Runtime de containers |
| `docker-buildx-plugin` | Build de imagens avancado |
| `docker-compose-plugin` | Docker Compose v2 |

### Passo 3.7: Verificar instalacao
```bash
docker --version
systemctl status docker
```

---

## 4. Criacao de Usuario para Docker

### Por que criar um usuario separado?
- Seguranca: nao usar root para tudo
- Organizacao: cada projeto em seu usuario
- Isolamento: permissoes separadas

### Passo 4.1: Criar usuario
```bash
adduser agendaumento
```
Vai pedir senha e dados (Enter para pular opcionais).

### Passo 4.2: Adicionar ao grupo docker
```bash
usermod -aG docker agendaumento
```

| Parte | Significado |
|-------|-------------|
| `usermod` | Modificar usuario |
| `-aG` | Append to Group (adicionar ao grupo) |
| `docker` | Nome do grupo |

### Passo 4.3: Adicionar ao grupo sudo (opcional)
```bash
usermod -aG sudo agendaumento
```

### Passo 4.4: Verificar grupos
```bash
groups agendaumento
```

**Saida esperada:**
```
agendaumento : agendaumento docker sudo
```

### Passo 4.5: Trocar para o usuario
```bash
su - agendaumento
```

| Parte | Significado |
|-------|-------------|
| `su` | Switch User |
| `-` | Carregar ambiente completo do usuario |

### Passo 4.6: Testar Docker
```bash
docker run hello-world
```

---

## 5. Primeiros Containers

### Rodar Nginx de teste
```bash
docker run -d -p 8080:80 --name teste-nginx nginx
```

| Flag | Significado |
|------|-------------|
| `-d` | Detached (background) |
| `-p 8080:80` | Porta do host:porta do container |
| `--name` | Nome amigavel para o container |

### Ver containers rodando
```bash
docker ps
```

### Ver todos os containers (incluindo parados)
```bash
docker ps -a
```

### Parar um container
```bash
docker stop teste-nginx
```

### Remover um container
```bash
docker rm teste-nginx
```

### Ver logs
```bash
docker logs teste-nginx
docker logs -f teste-nginx  # -f = follow (tempo real)
```

### Entrar dentro do container
```bash
docker exec -it teste-nginx bash
```

| Flag | Significado |
|------|-------------|
| `-i` | Interactive (manter STDIN aberto) |
| `-t` | TTY (terminal) |

---

## 6. Docker Compose

### O que e?
Arquivo YAML que define multiplos containers e como eles se conectam.

### Estrutura de pastas
```
/home/agendaumento/
└── agendaumento/
    ├── docker-compose.yml
    ├── backend/
    │   ├── Dockerfile
    │   └── ... (codigo)
    └── .env
```

### Criar pasta do projeto
```bash
mkdir -p ~/agendaumento
cd ~/agendaumento
```

### Criar arquivo docker-compose.yml
```bash
nano docker-compose.yml
```

### Conteudo do docker-compose.yml
```yaml
services:
  # ============================================
  # BANCO DE DADOS
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: agendaumento-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - agendaumento-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # BACKEND (Node.js API)
  # ============================================
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: agendaumento-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - agendaumento-network

# ============================================
# VOLUMES (dados persistentes)
# ============================================
volumes:
  postgres_data:

# ============================================
# REDE (comunicacao entre containers)
# ============================================
networks:
  agendaumento-network:
    driver: bridge
```

### Criar arquivo .env
```bash
nano .env
```

```env
# Banco de Dados
DB_USER=agendaumento
DB_PASSWORD=SUA_SENHA_FORTE_AQUI
DB_NAME=agendaumento_db

# JWT
JWT_SECRET=uma_chave_secreta_muito_longa_minimo_32_caracteres

# Ambiente
NODE_ENV=production
```

### Criar Dockerfile do backend
```bash
mkdir -p backend
nano backend/Dockerfile
```

```dockerfile
# Imagem base
FROM node:20-alpine

# Diretorio de trabalho dentro do container
WORKDIR /app

# Copiar arquivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar codigo fonte
COPY . .

# Porta que a aplicacao usa
EXPOSE 3000

# Comando para iniciar
CMD ["node", "src/server.js"]
```

### Comandos do Docker Compose

| Comando | O que faz |
|---------|-----------|
| `docker compose up -d` | Inicia todos os servicos |
| `docker compose down` | Para e remove containers |
| `docker compose ps` | Lista servicos rodando |
| `docker compose logs` | Ver logs de todos |
| `docker compose logs api` | Ver logs de um servico |
| `docker compose logs -f` | Logs em tempo real |
| `docker compose build` | Rebuild das imagens |
| `docker compose restart` | Reinicia servicos |
| `docker compose exec api sh` | Entrar no container |

### Subir o projeto
```bash
cd ~/agendaumento
docker compose up -d
```

### Verificar se esta rodando
```bash
docker compose ps
docker compose logs
```

---

## 7. Nginx como Proxy Reverso

### Arquitetura
```
Internet
    │
    ▼
Nginx (:80/:443)  ← SSL termina aqui
    │
    ├── pept.dominio.com → localhost:8082 (sem Docker)
    │
    └── agendaumento.dominio.com → localhost:3000 (Docker)
```

### Criar configuracao (como root)
```bash
sudo nano /etc/nginx/sites-available/agendaumento
```

```nginx
server {
    listen 80;
    server_name agendaumento.couriersknowledge.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Ativar configuracao
```bash
sudo ln -s /etc/nginx/sites-available/agendaumento /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Adicionar SSL (HTTPS)
```bash
sudo certbot --nginx -d agendaumento.couriersknowledge.com
```

---

## 8. Comandos de Referencia

### Comandos Docker Essenciais

```bash
# ===== CONTAINERS =====
docker ps                      # Listar rodando
docker ps -a                   # Listar todos
docker run -d -p 80:80 nginx   # Rodar container
docker stop <nome|id>          # Parar
docker start <nome|id>         # Iniciar
docker restart <nome|id>       # Reiniciar
docker rm <nome|id>            # Remover
docker rm -f <nome|id>         # Forcar remocao

# ===== LOGS =====
docker logs <nome|id>          # Ver logs
docker logs -f <nome|id>       # Logs tempo real
docker logs --tail 100 <nome>  # Ultimas 100 linhas

# ===== IMAGENS =====
docker images                  # Listar imagens
docker pull nginx              # Baixar imagem
docker rmi <imagem>            # Remover imagem
docker build -t nome:tag .     # Construir imagem

# ===== EXEC (entrar no container) =====
docker exec -it <nome> bash    # Entrar com bash
docker exec -it <nome> sh      # Entrar com sh (alpine)
docker exec <nome> ls /app     # Executar comando

# ===== LIMPEZA =====
docker system prune            # Limpar nao usados
docker system prune -a         # Limpar tudo (cuidado!)
docker volume prune            # Limpar volumes orfaos
```

### Comandos Docker Compose

```bash
# ===== CICLO DE VIDA =====
docker compose up -d           # Subir em background
docker compose down            # Derrubar
docker compose restart         # Reiniciar
docker compose stop            # Parar (sem remover)
docker compose start           # Iniciar (apos stop)

# ===== MONITORAMENTO =====
docker compose ps              # Status dos servicos
docker compose logs            # Todos os logs
docker compose logs -f api     # Logs tempo real de um servico
docker compose top             # Processos rodando

# ===== BUILD =====
docker compose build           # Rebuildar imagens
docker compose up -d --build   # Subir com rebuild
docker compose pull            # Atualizar imagens

# ===== EXEC =====
docker compose exec api sh     # Entrar no servico
docker compose exec postgres psql -U usuario -d banco
```

### Comandos Linux Uteis

```bash
# ===== USUARIOS =====
adduser nome                   # Criar usuario
usermod -aG grupo usuario      # Adicionar a grupo
groups usuario                 # Ver grupos
su - usuario                   # Trocar usuario
whoami                         # Usuario atual

# ===== ARQUIVOS =====
ls -la                         # Listar com detalhes
cat arquivo                    # Ver conteudo
nano arquivo                   # Editar arquivo
mkdir -p pasta/subpasta        # Criar pastas
rm -rf pasta                   # Remover (cuidado!)
chmod +x arquivo               # Dar permissao execucao
chown usuario:grupo arquivo    # Mudar dono

# ===== REDE =====
curl http://localhost:3000     # Testar endpoint
lsof -i :80                    # Ver quem usa porta
netstat -tulpn                 # Ver portas abertas

# ===== PROCESSOS =====
ps aux                         # Listar processos
htop                           # Monitor interativo
systemctl status nginx         # Status de servico
systemctl restart nginx        # Reiniciar servico

# ===== DISCO =====
df -h                          # Espaco em disco
du -sh /pasta                  # Tamanho de pasta
```

---

## Checklist: Novo Projeto com Docker

- [ ] Conectar no VPS como root
- [ ] Criar usuario para o projeto
- [ ] Adicionar usuario ao grupo docker
- [ ] Criar pasta do projeto em /home/usuario/
- [ ] Criar docker-compose.yml
- [ ] Criar .env com variaveis
- [ ] Criar Dockerfile (se necessario)
- [ ] Subir com `docker compose up -d`
- [ ] Verificar logs `docker compose logs`
- [ ] Configurar Nginx como proxy
- [ ] Ativar SSL com Certbot
- [ ] Criar registro DNS no Porkbun
- [ ] Testar no navegador

---

## Troubleshooting

### Porta ja em uso
```bash
# Ver quem usa a porta
sudo lsof -i :80

# Matar processo (cuidado!)
sudo kill -9 <PID>
```

### Container nao inicia
```bash
# Ver logs detalhados
docker compose logs api

# Ver status
docker compose ps
```

### Permissao negada no Docker
```bash
# Verificar se esta no grupo
groups

# Se nao estiver, adicionar e relogar
sudo usermod -aG docker $USER
# Depois: sair e entrar novamente (logout/login)
```

### Banco nao conecta
```bash
# Verificar se postgres esta healthy
docker compose ps

# Ver logs do postgres
docker compose logs postgres

# Testar conexao
docker compose exec postgres psql -U usuario -d banco
```

---

## Proximos Passos de Estudo

1. **Docker**
   - Dockerfile multi-stage
   - Docker networks avancado
   - Docker volumes e bind mounts

2. **Docker Compose**
   - Profiles
   - Override files
   - Secrets

3. **CI/CD**
   - GitHub Actions
   - Deploy automatico

4. **Kubernetes** (futuro)
   - Orquestracao de containers
   - Scaling automatico

---

_Documento criado durante aprendizado de Cloud Engineering_
_VPS: Debian Trixie | Docker CE_
