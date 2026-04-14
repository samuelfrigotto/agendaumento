# ============================================
# AGENDAUMENTO - Script de Deploy
# ============================================
# Uso: .\deploy.ps1
# Ou com mensagem: .\deploy.ps1 -m "minha mensagem de commit"
# ============================================

param(
    [Alias("m")]
    [string]$Message = "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

# Configuracoes
$VPS_USER = "agendaumento"
$VPS_IP = "76.13.69.251"
$VPS_PATH = "~/agendaumento"

# Cores
function Write-Step { param($text) Write-Host "`n[$((Get-Date).ToString('HH:mm:ss'))] $text" -ForegroundColor Cyan }
function Write-Success { param($text) Write-Host $text -ForegroundColor Green }
function Write-Error { param($text) Write-Host $text -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "   AGENDAUMENTO - Deploy para VPS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# ============================================
# PASSO 1: Git - Commit e Push
# ============================================
Write-Step "1/4 - Salvando no GitHub..."

git add .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Erro no git add"
    exit 1
}

git commit -m $Message
# Ignora erro se nao houver mudancas para commitar

git push
if ($LASTEXITCODE -ne 0) {
    Write-Error "Erro no git push. Verifique se o repositorio remoto esta configurado."
    Write-Host "Dica: git remote add origin https://github.com/seu-usuario/agendaumento.git" -ForegroundColor Gray
}
else {
    Write-Success "GitHub atualizado!"
}

# ============================================
# PASSO 2: Criar pasta no VPS (se nao existir)
# ============================================
Write-Step "2/4 - Preparando VPS..."

ssh "${VPS_USER}@${VPS_IP}" "mkdir -p ${VPS_PATH}/backend"
Write-Success "Pasta criada/verificada!"

# ============================================
# PASSO 3: Enviar arquivos via SCP
# ============================================
Write-Step "3/4 - Enviando arquivos para VPS..."

# Backend (pasta inteira)
Write-Host "  Enviando backend..." -ForegroundColor Gray
scp -r ./backend/* "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"

# Docker Compose
Write-Host "  Enviando docker-compose.yml..." -ForegroundColor Gray
scp ./docker-compose.yml "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"

# .env.example (template)
Write-Host "  Enviando .env.example..." -ForegroundColor Gray
scp ./.env.example "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"

Write-Success "Arquivos enviados!"

# ============================================
# PASSO 4: Rebuild no VPS
# ============================================
Write-Step "4/4 - Reconstruindo containers..."

ssh "${VPS_USER}@${VPS_IP}" @"
cd ${VPS_PATH}

# Verificar se .env existe
if [ ! -f .env ]; then
    echo '[AVISO] Arquivo .env nao encontrado!'
    echo 'Crie o .env antes de continuar:'
    echo '  cp .env.example .env'
    echo '  nano .env'
    exit 1
fi

# Rebuild e restart
docker compose down
docker compose up -d --build

# Mostrar status
echo ''
echo '=== Status dos containers ==='
docker compose ps
"@

if ($LASTEXITCODE -ne 0) {
    Write-Error "Erro no rebuild. Verifique os logs com: ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose logs'"
    exit 1
}

# ============================================
# FINALIZADO
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Deploy concluido com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "API rodando em: http://${VPS_IP}:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos uteis:" -ForegroundColor Gray
Write-Host "  Ver logs:    ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose logs -f'" -ForegroundColor Gray
Write-Host "  Status:      ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose ps'" -ForegroundColor Gray
Write-Host "  Parar:       ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose down'" -ForegroundColor Gray
Write-Host ""
