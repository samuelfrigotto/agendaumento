# Hardening do seu VPS — Segurança Básica Obrigatória

## O que você provavelmente já sabe

- SSH é o protocolo para acesso remoto ao servidor
- `ssh usuario@ip` para conectar
- Senha é uma forma de autenticação

---

## Conceitos Fundamentais

### Hardening
Processo de fortalecer a segurança de um sistema reduzindo sua **superfície de ataque** — eliminando vulnerabilidades, desativando o desnecessário e configurando proteções.

### Superfície de Ataque
Conjunto de pontos onde um atacante pode tentar entrar no sistema. Quanto menor, mais seguro.

### VPS — Virtual Private Server
Servidor virtual que você aluga e controla totalmente. Diferente de hosting compartilhado, você tem acesso root e responsabilidade pela segurança.

---

## 1. SSH por Chave — Autenticação sem Senha

### Por que chave é mais segura que senha?
- Senha: um atacante pode tentar milhares de combinações (brute force)
- Chave: matematicamente impossível de ser adivinhada, mesmo com bilhões de tentativas

### Par de Chaves SSH
Dois arquivos gerados juntos que funcionam como fechadura (chave pública) e chave (chave privada):

**Chave privada** — fica SOMENTE na sua máquina local. Nunca compartilhe.
```
~/.ssh/id_ed25519      (ou id_rsa para RSA)
```

**Chave pública** — você coloca no servidor. Pode ser compartilhada.
```
~/.ssh/id_ed25519.pub
```

### Algoritmos de Chave
| Algoritmo | Recomendação | Comando de geração        |
|-----------|--------------|---------------------------|
| Ed25519   | Preferido    | `-t ed25519`              |
| RSA 4096  | Aceitável    | `-t rsa -b 4096`          |
| RSA 2048  | Mínimo       | `-t rsa -b 2048`          |
| DSA       | Evitar       | Obsoleto                  |
| ECDSA     | OK           | `-t ecdsa -b 521`         |

### Gerando e Configurando a Chave

**Na sua máquina local:**
```bash
# Gerar par de chaves Ed25519 (mais moderno e seguro)
ssh-keygen -t ed25519 -C "samuel@meu-email.com"
# Confirme o local (~/.ssh/id_ed25519) e defina uma passphrase (senha da chave)

# Ver a chave pública gerada
cat ~/.ssh/id_ed25519.pub
# Saída: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... samuel@meu-email.com
```

**Copiar a chave para o servidor:**
```bash
# Método automático (se ainda tem acesso por senha)
ssh-copy-id -i ~/.ssh/id_ed25519.pub usuario@IP_DO_SERVIDOR

# Método manual (alternativa)
cat ~/.ssh/id_ed25519.pub | ssh usuario@IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**No servidor, verificar a chave foi adicionada:**
```bash
cat ~/.ssh/authorized_keys
# Deve conter sua chave pública
```

### Configurando o SSH para aceitar APENAS chaves

**No servidor, editar `/etc/ssh/sshd_config`:**
```bash
sudo nano /etc/ssh/sshd_config
```

Localizar e alterar (ou adicionar) as seguintes linhas:
```
# Desativar autenticação por senha
PasswordAuthentication no
ChallengeResponseAuthentication no

# Desativar login de root (próximo tópico)
PermitRootLogin no

# Número máximo de tentativas de autenticação
MaxAuthTries 3

# Desativar X11 Forwarding (se não usar interface gráfica)
X11Forwarding no

# Desativar agent forwarding se não precisar
AllowAgentForwarding no

# Tempo limite para autenticação
LoginGraceTime 30

# Porta SSH (opcional, mas recomendado mudar de 22)
# Port 2222
```

**Reiniciar o SSH:**
```bash
sudo systemctl restart sshd

# IMPORTANTE: Antes de fechar a sessão atual, abra outra janela e teste o acesso!
ssh -i ~/.ssh/id_ed25519 usuario@IP_DO_SERVIDOR
```

### Configuração local do SSH (atalhos)

No seu computador, em `~/.ssh/config`:
```
Host meu-servidor
    HostName 203.0.113.100
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    Port 22

Host prod
    HostName 203.0.113.200
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519_prod
```

Agora você conecta com apenas:
```bash
ssh meu-servidor
ssh prod
```

---

## 2. UFW — Uncomplicated Firewall

### O que é o UFW
Interface simplificada para o **iptables** (o firewall do kernel Linux). O iptables tem uma sintaxe complexa; o UFW torna tudo mais simples.

### Firewall
Sistema que filtra pacotes de rede com base em regras, bloqueando ou permitindo conexões.

### Configuração do UFW

```bash
# Instalar (se necessário)
sudo apt install ufw

# Ver status atual
sudo ufw status verbose

# Política padrão: negar tudo que entra, permitir tudo que sai
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH ANTES de ativar (ou você fica de fora!)
sudo ufw allow ssh          # permite porta 22
sudo ufw allow 22/tcp       # equivalente

# Se mudou a porta do SSH:
sudo ufw allow 2222/tcp

# Permitir serviços web
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 443/tcp      # HTTPS

# Ou permitir pelo nome do serviço
sudo ufw allow 'Nginx Full'   # HTTP + HTTPS para nginx

# Permitir de um IP específico (para DB admin, por exemplo)
sudo ufw allow from 203.0.113.5 to any port 5432 proto tcp

# Permitir de uma sub-rede
sudo ufw allow from 10.0.0.0/8

# Bloquear um IP específico
sudo ufw deny from 198.51.100.0/24

# ATIVAR o firewall
sudo ufw enable

# Ver regras numeradas
sudo ufw status numbered

# Remover uma regra pelo número
sudo ufw delete 3

# Remover uma regra pela definição
sudo ufw delete allow 80/tcp

# Desativar (emergência)
sudo ufw disable

# Resetar tudo
sudo ufw reset
```

### Verificando o que está bloqueado/permitido
```bash
sudo ufw status verbose
# Saída esperada:
# Status: active
# 
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW IN    Anywhere
# 80/tcp                     ALLOW IN    Anywhere
# 443/tcp                    ALLOW IN    Anywhere
```

### Regras para uma stack típica de aplicação web

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

---

## 3. Fail2Ban — Proteção contra Brute Force

### O que é o Fail2Ban
Daemon que **monitora logs do sistema** e bane automaticamente IPs que demonstram comportamento suspeito (muitas tentativas de login falhas, por exemplo).

### Como funciona
1. Monitora arquivos de log (ex: `/var/log/auth.log`)
2. Detecta padrões de falha (ex: 5 tentativas SSH falhas em 10 minutos)
3. Cria regra no iptables/UFW para banir o IP por um tempo definido
4. Remove o ban automaticamente após o tempo expirar

### Jail
Configuração do Fail2Ban para um serviço específico. Cada jail define:
- Qual log monitorar
- Qual padrão procurar (filter)
- Quantas falhas antes do ban (maxretry)
- Por quanto tempo banir (bantime)
- Em qual janela de tempo contar falhas (findtime)

### Instalação e Configuração

```bash
# Instalar
sudo apt install fail2ban

# Criar arquivo de configuração local (nunca edite o .conf diretamente)
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

**Configuração em `/etc/fail2ban/jail.local`:**
```ini
[DEFAULT]
# Ban por 1 hora
bantime = 3600

# Janela de tempo para contar falhas (10 minutos)
findtime = 600

# Número de falhas antes do ban
maxretry = 5

# Ignorar IPs locais e o seu próprio IP
ignoreip = 127.0.0.1/8 ::1 203.0.113.5

# Backend para monitorar logs
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = %(sshd_log)s
maxretry = 3
bantime = 86400    # 24 horas para SSH (mais restritivo)

# Proteção para Nginx (se tiver)
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

```bash
# Ativar e iniciar
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Status
sudo systemctl status fail2ban

# Ver jails ativos
sudo fail2ban-client status

# Ver status de um jail específico
sudo fail2ban-client status sshd

# Desbanir um IP (se baniu você mesmo)
sudo fail2ban-client set sshd unbanip 203.0.113.5

# Ver logs do fail2ban
sudo tail -f /var/log/fail2ban.log
journalctl -u fail2ban -f
```

---

## 4. Desativar Login de Root

### Por que não fazer login como root?
- Root é o usuário com nome previsível — atacantes sempre tentam primeiro
- Um erro como root pode destruir o sistema inteiro (sem confirmações)
- Auditar ações fica difícil (quem fez o quê?)

### Criar usuário não-root com privilégios sudo

```bash
# Criar novo usuário (faça isso antes de bloquear root!)
sudo adduser deploy

# Adicionar ao grupo sudo
sudo usermod -aG sudo deploy

# Copiar chaves SSH do root para o novo usuário
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Testar login com o novo usuário em OUTRA janela antes de prosseguir
ssh deploy@IP_DO_SERVIDOR
sudo whoami    # deve retornar "root"
```

**Em `/etc/ssh/sshd_config`:**
```
PermitRootLogin no
```

```bash
sudo systemctl restart sshd
```

### sudo — Super User Do
Executa um comando com privilégios de root temporariamente, com log de quem executou o quê.

```bash
sudo apt update           # executa como root
sudo -l                   # lista o que você pode fazer com sudo
sudo su -                 # muda para o shell do root (use com cuidado)
```

---

## Checklist Completo de Hardening

```bash
# === 1. ATUALIZAR O SISTEMA ===
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades

# === 2. CRIAR USUÁRIO NÃO-ROOT ===
sudo adduser deploy
sudo usermod -aG sudo deploy

# === 3. CONFIGURAR CHAVE SSH ===
# (na sua máquina local)
ssh-keygen -t ed25519 -C "sua-chave-servidor"
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@IP

# === 4. CONFIGURAR SSHD ===
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
# MaxAuthTries 3
sudo systemctl restart sshd

# === 5. CONFIGURAR UFW ===
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# === 6. INSTALAR FAIL2BAN ===
sudo apt install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
# editar jail.local conforme necessário
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# === 7. VERIFICAR ===
sudo ufw status verbose
sudo fail2ban-client status
sudo systemctl status sshd
```

---

## Monitoramento de Segurança

```bash
# Ver tentativas de login falhas
sudo journalctl -u sshd | grep "Failed"
sudo grep "Failed password" /var/log/auth.log

# Ver logins bem-sucedidos
sudo last
sudo lastlog

# Ver IPs banidos pelo Fail2Ban
sudo fail2ban-client status sshd

# Ver conexões ativas
ss -tulnp
who                    # quem está logado agora
w                      # com mais detalhes

# Ver últimos comandos sudo
sudo journalctl | grep sudo

# Verificar arquivos modificados recentemente
find /etc -newer /etc/passwd -type f 2>/dev/null
find /bin /usr/bin -newer /etc/passwd -type f 2>/dev/null

# Monitorar tentativas em tempo real
sudo tail -f /var/log/auth.log
sudo journalctl -u sshd -f
```

---

## Hardening Adicional (Próximo Nível)

### unattended-upgrades
Instala automaticamente atualizações de segurança sem intervenção manual.
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### Mudar porta do SSH
Reduz o ruído de bots que varrem a porta 22.
```bash
# /etc/ssh/sshd_config
Port 2222

# Atualizar UFW
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

### Desativar IPv6 se não usar
```bash
# /etc/sysctl.conf
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
sudo sysctl -p
```

### logwatch — Relatório diário de logs
```bash
sudo apt install logwatch
sudo logwatch --output stdout --format text --range today
```

### rkhunter — Detector de Rootkits
```bash
sudo apt install rkhunter
sudo rkhunter --update
sudo rkhunter --check
```

---

## Resumo: O Mínimo Indispensável

| Item                    | Por quê                                               | Como verificar                       |
|-------------------------|-------------------------------------------------------|--------------------------------------|
| SSH por chave           | Brute force de senha é trivial para bots              | `grep PasswordAuthentication /etc/ssh/sshd_config` |
| PermitRootLogin no      | Root é o alvo número 1 de ataques                     | `grep PermitRootLogin /etc/ssh/sshd_config` |
| UFW ativo               | Por padrão todas as portas ficam expostas             | `sudo ufw status`                    |
| Fail2Ban ativo          | Sem ele, bots tentam infinitamente                    | `sudo fail2ban-client status sshd`   |
| Sistema atualizado      | 80% dos ataques exploram vulnerabilidades conhecidas  | `apt list --upgradable`              |
