# Gerenciamento de Processos no Linux

## O que você provavelmente já sabe

- `ps aux` para listar processos
- Matar processo com `kill PID`
- `Ctrl+C` para encerrar um processo no terminal
- `&` para rodar processo em background

---

## Conceitos Fundamentais

### Processo
Um programa em execução. Cada processo tem um identificador único chamado **PID** (Process ID).

### PID — Process ID
Número único atribuído pelo kernel a cada processo em execução.
```bash
echo $$    # PID do shell atual
```

### PPID — Parent Process ID
O PID do processo pai — aquele que criou o processo atual. Todo processo (exceto o init/systemd) tem um pai.

### Daemon
Processo que roda em background, sem interação com o usuário. Geralmente termina com `d` no nome: `nginx`, `sshd`, `mysqld`, `cron`.

### Signal — Sinal
Notificação enviada a um processo para acionar um comportamento.
| Sinal      | Número | Significado                              |
|------------|--------|------------------------------------------|
| `SIGTERM`  | 15     | Pede encerramento educado (padrão do kill)|
| `SIGKILL`  | 9      | Força encerramento imediato (não pode ser ignorado)|
| `SIGHUP`   | 1      | Recarrega configuração (usado em nginx, etc)|
| `SIGSTOP`  | 19     | Pausa o processo                         |
| `SIGCONT`  | 18     | Retoma processo pausado                  |

```bash
kill -15 1234    # SIGTERM no PID 1234 (encerramento suave)
kill -9 1234     # SIGKILL no PID 1234 (força bruta)
kill -1 1234     # SIGHUP — reload de config
killall nginx    # mata todos os processos com nome "nginx"
pkill -f "python app.py"  # mata pelo padrão no nome/comando
```

---

## systemd — O Gerenciador de Serviços

### O que é o systemd
Sistema de inicialização (init system) e gerenciador de serviços do Linux moderno. Substituiu o SysVinit e Upstart. É o PID 1 — o primeiro processo que o kernel inicia.

### Unit — Unidade
Arquivo de configuração que o systemd usa para gerenciar recursos. Tipos mais comuns:
- `.service` — serviços (nginx, mysql, sshd)
- `.timer` — equivalente ao cron no systemd
- `.socket` — sockets de rede ou IPC
- `.mount` — pontos de montagem

### Service Unit File
Arquivo que define como um serviço deve ser iniciado, parado e reiniciado.
Localização padrão: `/etc/systemd/system/` ou `/lib/systemd/system/`

```ini
# /etc/systemd/system/minha-app.service
[Unit]
Description=Minha Aplicação Node.js
After=network.target

[Service]
Type=simple
User=samuel
WorkingDirectory=/var/www/minha-app
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### Comandos systemctl essenciais

```bash
# Gerenciar serviços
systemctl start nginx          # Inicia
systemctl stop nginx           # Para
systemctl restart nginx        # Para e inicia
systemctl reload nginx         # Recarrega config sem reiniciar
systemctl status nginx         # Mostra status detalhado

# Ativar/desativar na inicialização do sistema
systemctl enable nginx         # Ativa para iniciar no boot
systemctl disable nginx        # Desativa
systemctl is-enabled nginx     # Verifica se está ativado

# Listar
systemctl list-units --type=service           # Todos os serviços ativos
systemctl list-units --type=service --failed  # Somente os que falharam
systemctl list-unit-files --type=service      # Todos (ativos e inativos)

# Recarregar após modificar unit files
systemctl daemon-reload
```

### Targets — Equivalente aos Runlevels
Agrupamento de serviços que definem o estado do sistema.
```bash
systemctl get-default               # Ver target padrão
systemctl set-default multi-user.target  # Definir padrão
systemctl isolate rescue.target     # Entrar em modo de recuperação
```

---

## journalctl — Logs do systemd

### O que é o journalctl
Ferramenta para consultar o **journal** — o sistema de logs centralizado do systemd. Coleta logs de kernel, serviços, e boot.

### Comandos essenciais

```bash
# Ver todos os logs (mais recente no final)
journalctl

# Logs de um serviço específico
journalctl -u nginx
journalctl -u nginx -u mysql      # Múltiplos serviços

# Seguir em tempo real (como tail -f)
journalctl -u nginx -f

# Últimas N linhas
journalctl -u nginx -n 100

# Por período de tempo
journalctl --since "2024-01-15 10:00:00"
journalctl --since "1 hour ago"
journalctl --since "yesterday"
journalctl --since "2024-01-15" --until "2024-01-16"

# Somente erros
journalctl -p err
journalctl -p err..crit           # Entre err e crit

# Logs do boot atual
journalctl -b

# Logs do boot anterior
journalctl -b -1

# Formato compacto (uma linha por entrada)
journalctl -u nginx -o short

# Ver uso de espaço
journalctl --disk-usage

# Limpar logs antigos
journalctl --vacuum-time=30d      # Manter somente os últimos 30 dias
journalctl --vacuum-size=500M     # Manter somente até 500MB
```

---

## top — Monitor de Processos em Tempo Real

### O que é o top
Ferramenta interativa que mostra processos em execução com uso de CPU e memória em tempo real.

```bash
top
```

### Entendendo a interface do top

```
top - 14:23:01 up 5 days,  3:12,  1 user,  load average: 0.52, 0.48, 0.41
Tasks: 142 total,   1 running, 141 sleeping,   0 stopped,   0 zombie
%Cpu(s):  3.2 us,  1.1 sy,  0.0 ni, 95.4 id,  0.3 wa,  0.0 hi,  0.0 si
MiB Mem :   1987.6 total,    234.2 free,    981.4 used,    772.0 buff/cache
MiB Swap:   2048.0 total,   1987.3 free,     60.7 used.    812.3 avail Mem
```

| Campo          | Significado                                          |
|----------------|------------------------------------------------------|
| `load average` | Carga média do sistema nos últimos 1, 5, 15 minutos  |
| `us`           | CPU em espaço de usuário                             |
| `sy`           | CPU em espaço do kernel (system)                     |
| `id`           | CPU ociosa (idle) — quanto maior, melhor             |
| `wa`           | CPU esperando I/O (disco lento = wa alto)            |
| `buff/cache`   | Memória usada como cache — o Linux pode liberar isso |

### Atalhos dentro do top
| Tecla | Ação                                    |
|-------|-----------------------------------------|
| `P`   | Ordenar por CPU                         |
| `M`   | Ordenar por memória                     |
| `k`   | Matar processo (digitar PID)            |
| `r`   | Renice (mudar prioridade)               |
| `q`   | Sair                                    |
| `1`   | Expandir uso por CPU individual         |

---

## htop — Monitor Avançado (Instalar separado)

### O que é o htop
Versão melhorada do `top` com interface colorida, barras gráficas e navegação com mouse.

```bash
apt install htop    # Debian/Ubuntu
yum install htop    # CentOS/RHEL
htop
```

### Vantagens do htop sobre o top
- Barras visuais de CPU e memória
- Pode rolar horizontal e verticalmente
- Busca de processos com `/`
- Matar processos com `F9` (escolhendo o sinal)
- Ver árvore de processos com `F5`
- Suporte a mouse

### Colunas importantes do htop
| Coluna    | Significado                                                        |
|-----------|--------------------------------------------------------------------|
| `PID`     | Process ID                                                         |
| `USER`    | Usuário dono do processo                                           |
| `PRI/NI`  | Prioridade / Nice value (-20 a 19, menor = mais prioritário)       |
| `VIRT`    | Memória virtual total alocada pelo processo                        |
| `RES`     | Memória RAM física em uso (resident memory)                        |
| `SHR`     | Memória compartilhada com outros processos                         |
| `S`       | Estado: R=rodando, S=dormindo, D=aguardando I/O, Z=zumbi           |
| `CPU%`    | Percentual de CPU em uso                                           |
| `MEM%`    | Percentual de RAM em uso                                           |
| `TIME+`   | Tempo total de CPU consumido                                       |
| `COMMAND` | Comando que iniciou o processo                                     |

---

## nice e renice — Prioridade de Processos

### nice
Inicia um processo com uma prioridade definida. Valores de -20 (mais prioritário) a 19 (menos prioritário). Padrão é 0.
```bash
nice -n 10 /scripts/backup.sh    # Executa com baixa prioridade
nice -n -5 processo-critico      # Mais prioritário (requer sudo)
```

### renice
Altera a prioridade de um processo já em execução.
```bash
renice -n 15 -p 1234    # Reduz prioridade do PID 1234
```

---

## Comandos Adicionais Úteis

```bash
# Ver processos em árvore
pstree
pstree -p    # Com PIDs

# Informações de um processo específico
cat /proc/1234/status    # Detalhes do PID 1234
ls -la /proc/1234/fd/    # Arquivos abertos pelo processo

# Monitorar uso de I/O por processo
iotop         # Precisa instalar: apt install iotop

# Ver sockets e conexões
ss -tuln      # Portas abertas (TCP/UDP, listening)
ss -tulnp     # Com nome do processo

# Processos por usuário
ps aux | grep samuel

# CPU e memória de um processo ao longo do tempo
pidstat -u -p 1234 1   # A cada 1 segundo
```

---

## Criando seu próprio serviço systemd — Passo a Passo

```bash
# 1. Criar o unit file
sudo nano /etc/systemd/system/minha-api.service

# 2. Cole o conteúdo:
[Unit]
Description=Minha API
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/api
ExecStart=/usr/bin/node index.js
Restart=on-failure
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target

# 3. Recarregar o daemon
sudo systemctl daemon-reload

# 4. Ativar e iniciar
sudo systemctl enable minha-api
sudo systemctl start minha-api

# 5. Verificar
sudo systemctl status minha-api
journalctl -u minha-api -f
```

---

## Resumo Rápido de Comandos

| Objetivo                          | Comando                              |
|-----------------------------------|--------------------------------------|
| Status de serviço                 | `systemctl status nginx`             |
| Logs em tempo real                | `journalctl -u nginx -f`             |
| Logs com erro                     | `journalctl -p err -u nginx`         |
| Monitor de recursos               | `htop`                               |
| Processos usando mais CPU         | `top` então `P`                      |
| Matar processo                    | `kill -9 PID` ou `pkill nome`        |
| Porta em uso por qual processo    | `ss -tulnp | grep 3000`              |
| Consumo de I/O                    | `iotop`                              |
