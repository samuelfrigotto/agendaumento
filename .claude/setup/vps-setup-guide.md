# Guia Completo: Configuração de VPS para Novo Projeto

Este guia documenta o processo completo para configurar um novo software no VPS utilizando **PostgreSQL** como banco de dados e **Node.js/Spring Boot** como backend.

---

## 1. Acesso ao VPS

### Dados de Acesso Atuais
- **IP:** `76.13.69.251`
- **Usuário:** `pept`
- **Comando SSH:** `ssh pept@76.13.69.251`

### Primeiro Acesso (se VPS novo)
```bash
ssh root@76.13.69.251
```

---

## 2. Criar Novo Usuário no VPS

É recomendado criar um usuário específico para cada projeto ao invés de usar root.

```bash
# Conectar como root
ssh root@76.13.69.251

# Criar novo usuário (substitua 'novoapp' pelo nome do seu projeto)
sudo adduser novoapp

# Adicionar usuário ao grupo sudo
sudo usermod -aG sudo novoapp

# Configurar SSH para o novo usuário
sudo mkdir -p /home/novoapp/.ssh
sudo cp ~/.ssh/authorized_keys /home/novoapp/.ssh/
sudo chown -R novoapp:novoapp /home/novoapp/.ssh
sudo chmod 700 /home/novoapp/.ssh
sudo chmod 600 /home/novoapp/.ssh/authorized_keys

# Testar acesso com novo usuário
ssh novoapp@76.13.69.251
```

---

## 3. Instalar Dependências no VPS

### Atualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar Node.js (via NVM - recomendado)
```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recarregar terminal
source ~/.bashrc

# Instalar Node.js LTS
nvm install --lts
nvm use --lts

# Verificar instalação
node -v
npm -v
```

### Instalar Java 21 (para Spring Boot)
```bash
sudo apt install openjdk-21-jdk -y
java -version
```

### Instalar PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y

# Verificar se está rodando
sudo systemctl status postgresql
```

### Instalar Nginx (Reverse Proxy)
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Instalar Certbot (SSL/HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 4. Configurar PostgreSQL - Novo Banco de Dados

### Acessar PostgreSQL como Admin
```bash
sudo -u postgres psql
```

### Criar Banco e Usuário para o Novo Projeto
```sql
-- Criar usuário (substitua 'novoapp' e 'SUA_SENHA_SEGURA')
CREATE USER novoapp WITH PASSWORD 'SUA_SENHA_SEGURA';

-- Criar banco de dados
CREATE DATABASE novoapp_db OWNER novoapp;

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE novoapp_db TO novoapp;

-- Conectar ao banco para dar permissões no schema
\c novoapp_db
GRANT ALL ON SCHEMA public TO novoapp;

-- Sair
\q
```

### Testar Conexão
```bash
psql -h localhost -U novoapp -d novoapp_db
```

### Configurar Acesso Remoto (se necessário)
```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Adicionar linha para acesso local via senha:
# local   all   novoapp   md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

---

## 5. Configurar Domínio/Subdomínio no Porkbun

Para cada novo projeto, você precisa criar um **subdomínio** apontando para o VPS.

### Exemplo Atual (Pept)
```
REACT_APP_API_URL=https://pept.couriersknowledge.com
```

### Para Novo Projeto
Você precisa criar um novo registro DNS no Porkbun:

1. Acesse [Porkbun](https://porkbun.com) e faça login
2. Vá em **Domain Management** > **couriersknowledge.com** > **DNS Records**
3. Adicione um novo registro:
   - **Type:** `A`
   - **Host:** `novoapp` (nome do seu projeto)
   - **Answer:** `76.13.69.251` (IP do VPS)
   - **TTL:** `600` (ou padrão)
4. Salve o registro

### Resultado
Após propagação DNS (alguns minutos), você terá:
```
https://novoapp.couriersknowledge.com
```

---

## 6. Criar Estrutura de Pastas no VPS

```bash
# Conectar ao VPS
ssh novoapp@76.13.69.251

# Criar estrutura de pastas
mkdir -p ~/novoapp/backend
mkdir -p ~/novoapp/frontend
mkdir -p ~/novoapp/logs

# Criar arquivo .env para o backend
nano ~/novoapp/backend/.env
```

### Exemplo de .env para Backend (Spring Boot)
```env
DB_URL=jdbc:postgresql://localhost:5432/novoapp_db
DB_USERNAME=novoapp
DB_PASSWORD=SUA_SENHA_SEGURA
JWT_SECRET=gere-uma-chave-secreta-longa-e-segura-aqui
SERVER_PORT=8083
REACT_APP_API_URL=https://novoapp.couriersknowledge.com
```

### Exemplo de .env para Backend (Node.js)
```env
DATABASE_URL=postgresql://novoapp:SUA_SENHA_SEGURA@localhost:5432/novoapp_db
JWT_SECRET=gere-uma-chave-secreta-longa-e-segura-aqui
PORT=8083
NODE_ENV=production
```

---

## 7. Configurar Nginx (Reverse Proxy + SSL)

### Criar Configuração do Nginx
```bash
sudo nano /etc/nginx/sites-available/novoapp
```

### Conteúdo do Arquivo
```nginx
server {
    listen 80;
    server_name novoapp.couriersknowledge.com;

    location / {
        proxy_pass http://localhost:8083;
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

### Ativar Configuração
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/novoapp /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### Configurar SSL (HTTPS) com Certbot
```bash
sudo certbot --nginx -d novoapp.couriersknowledge.com
```

---

## 8. Criar Serviço Systemd

Para manter a aplicação rodando em background e reiniciar automaticamente.

### Para Spring Boot (Java)
```bash
sudo nano /etc/systemd/system/novoapp-backend.service
```

```ini
[Unit]
Description=NovoApp Backend Service
After=network.target postgresql.service

[Service]
User=novoapp
WorkingDirectory=/home/novoapp/novoapp/backend
ExecStart=/usr/bin/java -jar /home/novoapp/novoapp/backend/novoapp-api.jar
EnvironmentFile=/home/novoapp/novoapp/backend/.env
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Para Node.js
```bash
sudo nano /etc/systemd/system/novoapp-backend.service
```

```ini
[Unit]
Description=NovoApp Backend Service (Node.js)
After=network.target postgresql.service

[Service]
User=novoapp
WorkingDirectory=/home/novoapp/novoapp/backend
ExecStart=/home/novoapp/.nvm/versions/node/v20.x.x/bin/node server.js
EnvironmentFile=/home/novoapp/novoapp/backend/.env
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Ativar e Iniciar Serviço
```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar para iniciar no boot
sudo systemctl enable novoapp-backend

# Iniciar serviço
sudo systemctl start novoapp-backend

# Verificar status
sudo systemctl status novoapp-backend
```

---

## 9. Deploy do Código

### Para Spring Boot
```bash
# No seu computador local - compilar JAR
mvn clean package -DskipTests

# Enviar para VPS
scp "caminho/do/seu/projeto.jar" novoapp@76.13.69.251:~/novoapp/backend/novoapp-api.jar

# No VPS - reiniciar serviço
ssh novoapp@76.13.69.251 "sudo systemctl restart novoapp-backend"
```

### Para Node.js
```bash
# No seu computador local - enviar código
scp -r ./backend/* novoapp@76.13.69.251:~/novoapp/backend/

# No VPS - instalar dependências e reiniciar
ssh novoapp@76.13.69.251
cd ~/novoapp/backend
npm install --production
sudo systemctl restart novoapp-backend
```

---

## 10. Comandos Úteis de Manutenção

### Gerenciar Serviço
```bash
sudo systemctl status novoapp-backend    # Ver status
sudo systemctl restart novoapp-backend   # Reiniciar
sudo systemctl stop novoapp-backend      # Parar
sudo systemctl start novoapp-backend     # Iniciar
```

### Ver Logs
```bash
# Logs em tempo real
sudo journalctl -u novoapp-backend -f

# Últimos 100 logs
sudo journalctl -u novoapp-backend -n 100

# Logs dos últimos 30 minutos
sudo journalctl -u novoapp-backend --since "30 minutes ago"
```

### Gerenciar Nginx
```bash
sudo systemctl status nginx      # Ver status
sudo systemctl restart nginx     # Reiniciar
sudo nginx -t                    # Testar configuração
```

### Renovar Certificado SSL
```bash
sudo certbot renew
```

### Conectar ao Banco de Dados
```bash
psql -h localhost -U novoapp -d novoapp_db
```

### Backup do Banco de Dados
```bash
pg_dump -U novoapp -d novoapp_db > ~/novoapp/backup_$(date +%Y%m%d).sql
```

---

## 11. Checklist para Novo Projeto

- [ ] Criar usuário no VPS (ou usar existente)
- [ ] Criar banco de dados PostgreSQL
- [ ] Criar subdomínio no Porkbun (ex: `novoapp.couriersknowledge.com`)
- [ ] Criar estrutura de pastas no VPS
- [ ] Criar arquivo `.env` com credenciais
- [ ] Configurar Nginx para o novo domínio
- [ ] Gerar certificado SSL com Certbot
- [ ] Criar serviço systemd
- [ ] Fazer deploy do código
- [ ] Testar a API no navegador

---

## 12. Portas em Uso (Referência)

| Projeto | Porta Backend | URL |
|---------|---------------|-----|
| Pept | 8082 | https://pept.couriersknowledge.com |
| NovoApp | 8083 | https://novoapp.couriersknowledge.com |
| ... | 8084 | ... |

**Importante:** Cada novo projeto deve usar uma porta diferente no backend!

---

## Dúvidas Frequentes

### Como verificar se a porta está em uso?
```bash
sudo lsof -i :8083
# ou
sudo netstat -tulpn | grep 8083
```

### Como liberar uma porta no firewall?
```bash
sudo ufw allow 8083
```

### Erro de permissão no PostgreSQL?
```bash
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE novoapp_db TO novoapp;
\c novoapp_db
GRANT ALL ON SCHEMA public TO novoapp;
```
