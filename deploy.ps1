# ============================================
# AGENDAUMENTO - Script de Deploy Completo
# ============================================
# Uso: .\deploy.ps1
# Ou com mensagem: .\deploy.ps1 -m "minha mensagem de commit"
# Apenas backend: .\deploy.ps1 -backend
# Apenas frontend: .\deploy.ps1 -frontend
# ============================================

param(
    [Alias("m")]
    [string]$Message = "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    [switch]$backend,
    [switch]$frontend
)

# Se nenhum flag especificado, faz deploy de tudo
if (-not $backend -and -not $frontend) {
    $backend = $true
    $frontend = $true
}

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
Write-Step "1/5 - Salvando no GitHub..."

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
# PASSO 2: Build do Frontend (se necessario)
# ============================================
if ($frontend) {
    Write-Step "2/5 - Build do Frontend (Angular)..."

    Push-Location ./frontend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erro no build do frontend"
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Success "Frontend compilado!"
}
else {
    Write-Step "2/5 - Build do Frontend... PULADO"
}

# ============================================
# PASSO 3: Preparar VPS
# ============================================
Write-Step "3/5 - Preparando VPS..."

ssh "${VPS_USER}@${VPS_IP}" "mkdir -p ${VPS_PATH}/backend ${VPS_PATH}/frontend"
Write-Success "Pastas criadas/verificadas!"

# ============================================
# PASSO 4: Enviar arquivos via SCP
# ============================================
Write-Step "4/5 - Enviando arquivos para VPS..."

if ($backend) {
    # Envia apenas o codigo-fonte — node_modules e gerado pelo Docker na VPS
    Write-Host "  Enviando src/..." -ForegroundColor Gray
    scp -r ./backend/src "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"

    Write-Host "  Enviando migrations/..." -ForegroundColor Gray
    scp -r ./backend/migrations "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"

    Write-Host "  Enviando package.json / Dockerfile..." -ForegroundColor Gray
    scp ./backend/package.json "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"
    scp ./backend/package-lock.json "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"
    scp ./backend/Dockerfile "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"
    scp ./backend/.dockerignore "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"

    Write-Host "  Enviando docker-compose.yml..." -ForegroundColor Gray
    scp ./docker-compose.yml "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"

    Write-Host "  Enviando .env.example..." -ForegroundColor Gray
    scp ./.env.example "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
}

if ($frontend) {
    Write-Host "  Enviando frontend..." -ForegroundColor Gray
    scp -r ./frontend/dist/agendaumento/browser/* "${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/"
}

Write-Success "Arquivos enviados!"

# ============================================
# PASSO 5: Rebuild no VPS (se backend)
# ============================================
if ($backend) {
    Write-Step "5/5 - Reconstruindo containers..."

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
}
else {
    Write-Step "5/5 - Rebuild containers... PULADO (apenas frontend)"
}

# ============================================
# FINALIZADO
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Deploy concluido com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Site: https://agendaumento.couriersknowledge.com" -ForegroundColor Cyan
Write-Host "API:  https://agendaumento.couriersknowledge.com/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos uteis:" -ForegroundColor Gray
Write-Host "  Ver logs:    ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose logs -f'" -ForegroundColor Gray
Write-Host "  Status:      ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose ps'" -ForegroundColor Gray
Write-Host "  Parar:       ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose down'" -ForegroundColor Gray
Write-Host ""
