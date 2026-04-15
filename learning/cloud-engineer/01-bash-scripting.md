# Bash Scripting — Automatizando Tarefas no Linux

## O que você provavelmente já sabe

- Executar comandos no terminal (`ls`, `cd`, `mkdir`, `cp`, `mv`, `rm`)
- Redirecionar saída com `>` e `>>`
- Encadear comandos com `|` (pipe)
- Criar arquivos e editar com `nano` ou `vim`

---

## Conceitos Fundamentais

### Shebang
A primeira linha de todo script bash. Diz ao sistema qual interpretador usar.
```bash
#!/bin/bash
```

### Variáveis
Armazenam valores para reutilização no script. Sem espaço ao redor do `=`.
```bash
NOME="Samuel"
echo "Olá, $NOME"
```

### Variáveis de Ambiente
Variáveis globais do sistema, disponíveis para qualquer processo.
```bash
echo $HOME       # /home/samuel
echo $USER       # samuel
echo $PATH       # lista de diretórios onde o sistema busca executáveis
```

### Argumentos Posicionais
Valores passados ao script na chamada. `$1` é o primeiro, `$2` o segundo, etc.
```bash
#!/bin/bash
echo "Primeiro argumento: $1"
echo "Segundo argumento: $2"
echo "Todos os argumentos: $@"
echo "Quantidade de argumentos: $#"
```

### Condicionais (if/else)
```bash
if [ -f "/etc/nginx/nginx.conf" ]; then
    echo "Nginx está instalado"
else
    echo "Nginx não encontrado"
fi
```

### Operadores de teste comuns
| Operador | Significado                     |
|----------|---------------------------------|
| `-f`     | É um arquivo regular?           |
| `-d`     | É um diretório?                 |
| `-e`     | Existe?                         |
| `-z`     | String vazia?                   |
| `-n`     | String não vazia?               |
| `==`     | Strings iguais?                 |
| `-eq`    | Números iguais?                 |
| `-gt`    | Maior que? (greater than)       |
| `-lt`    | Menor que? (less than)          |

### Loops
```bash
# Loop com lista
for SERVICO in nginx mysql redis; do
    systemctl restart $SERVICO
    echo "$SERVICO reiniciado"
done

# Loop com range
for i in {1..10}; do
    echo "Iteração $i"
done

# While loop
CONTADOR=0
while [ $CONTADOR -lt 5 ]; do
    echo "Contador: $CONTADOR"
    CONTADOR=$((CONTADOR + 1))
done
```

### Funções
```bash
function log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Script iniciado"
log "Backup concluído"
```

### Exit Codes
Todo comando retorna um código: `0` = sucesso, qualquer outro = erro. `$?` captura o código do último comando.
```bash
systemctl restart nginx
if [ $? -eq 0 ]; then
    echo "Nginx reiniciado com sucesso"
else
    echo "Falha ao reiniciar nginx"
fi
```

### Cron — Agendamento de tarefas
Daemon que executa scripts em horários programados. Editar com `crontab -e`.
```
# Formato: minuto hora dia_do_mes mês dia_da_semana comando
0 2 * * *   /home/samuel/backup.sh        # Todo dia às 02:00
*/10 * * * * /scripts/check-disk.sh       # A cada 10 minutos
0 0 * * 1   /scripts/limpeza-logs.sh     # Toda segunda-feira à meia-noite
```

---

## Scripts Práticos

### Script 1 — Backup com timestamp

```bash
#!/bin/bash

# === CONFIGURAÇÃO ===
ORIGEM="/var/www/html"
DESTINO="/backups"
DATA=$(date '+%Y-%m-%d_%H-%M')
ARQUIVO="backup_$DATA.tar.gz"
LOG="/var/log/backup.log"

# === FUNÇÃO DE LOG ===
function log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"
}

# === VERIFICAÇÕES ===
if [ ! -d "$ORIGEM" ]; then
    log "ERRO: Diretório de origem não existe: $ORIGEM"
    exit 1
fi

mkdir -p "$DESTINO"

# === BACKUP ===
log "Iniciando backup de $ORIGEM"

tar -czf "$DESTINO/$ARQUIVO" "$ORIGEM"

if [ $? -eq 0 ]; then
    log "Backup criado com sucesso: $ARQUIVO"
else
    log "ERRO: Falha ao criar backup"
    exit 1
fi

# === LIMPEZA — manter apenas os 7 mais recentes ===
log "Removendo backups antigos (mantendo os 7 mais recentes)"
ls -t "$DESTINO"/backup_*.tar.gz | tail -n +8 | xargs rm -f

log "Processo de backup finalizado"
```

### Script 2 — Limpeza de logs antigos

```bash
#!/bin/bash

DIRETORIO_LOGS="/var/log/minha-app"
DIAS_MANTER=30

echo "Removendo logs com mais de $DIAS_MANTER dias em $DIRETORIO_LOGS"

find "$DIRETORIO_LOGS" -name "*.log" -mtime +$DIAS_MANTER -delete

echo "Limpeza concluída. Espaço atual:"
du -sh "$DIRETORIO_LOGS"
```

### Script 3 — Restart de serviços com checagem de saúde

```bash
#!/bin/bash

SERVICOS=("nginx" "mysql" "redis-server")

for SERVICO in "${SERVICOS[@]}"; do
    STATUS=$(systemctl is-active "$SERVICO")

    if [ "$STATUS" != "active" ]; then
        echo "[$SERVICO] Inativo! Tentando reiniciar..."
        systemctl restart "$SERVICO"

        sleep 2

        STATUS_NOVO=$(systemctl is-active "$SERVICO")
        if [ "$STATUS_NOVO" == "active" ]; then
            echo "[$SERVICO] Reiniciado com sucesso"
        else
            echo "[$SERVICO] FALHA ao reiniciar — verificar manualmente"
        fi
    else
        echo "[$SERVICO] OK (rodando)"
    fi
done
```

---

## Boas Práticas

| Prática                         | Por quê                                             |
|---------------------------------|-----------------------------------------------------|
| `set -e` no início              | Para o script se qualquer comando falhar            |
| `set -u` no início              | Erro em variável indefinida (evita bugs silenciosos)|
| Sempre logar com timestamp      | Facilita diagnóstico posterior                      |
| Usar `"$VAR"` com aspas        | Evita quebra com espaços no valor                   |
| Testar antes de executar em prod| Use `echo` antes de comandos destrutivos            |

```bash
#!/bin/bash
set -e   # exit on error
set -u   # treat unset vars as errors
set -o pipefail  # pipe retorna erro se qualquer parte falhar
```

---

## Próximos Passos

- Estudar `awk` e `sed` para manipulação de texto
- Aprender `trap` para capturar sinais e fazer cleanup
- Integrar scripts com notificações (Slack webhook, email via `mail`)
- Versionar seus scripts no Git
