# ============================================
# AGENDAUMENTO - Script de Deploy Completo
# ============================================
# Uso: .\deploy.ps1
# Com mensagem: .\deploy.ps1 -m "minha mensagem"
# Apenas backend: .\deploy.ps1 -backend
# Apenas frontend: .\deploy.ps1 -frontend
# ============================================

param(
    [Alias("m")]
    [string]$Message = "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    [switch]$backend,
    [switch]$frontend
)

if (-not $backend -and -not $frontend) {
    $backend = $true
    $frontend = $true
}

$VPS_USER = "agendaumento"
$VPS_IP   = "76.13.69.251"
$VPS_PATH = "~/agendaumento"

function Write-Step    { param($t) Write-Host "`n[$((Get-Date).ToString('HH:mm:ss'))] $t" -ForegroundColor Cyan }
function Write-Success { param($t) Write-Host $t -ForegroundColor Green }
function Write-Err     { param($t) Write-Host $t -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "   AGENDAUMENTO - Deploy para VPS"       -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# ── 1. Git ────────────────────────────────────────────────────────────────────
Write-Step "1/5 - Salvando no GitHub..."
git add .
git commit -m $Message
git push
if ($LASTEXITCODE -ne 0) {
    Write-Err "Aviso: git push falhou (pode nao haver remote configurado)"
} else {
    Write-Success "GitHub atualizado!"
}

# ── 2. Build do Frontend (React/Vite) ────────────────────────────────────────
if ($frontend) {
    Write-Step "2/5 - Build do Frontend (React/Vite)..."
    Push-Location ./frontend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Erro no build do frontend"
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Success "Frontend compilado! (saida: frontend/dist/)"
} else {
    Write-Step "2/5 - Build do Frontend... PULADO"
}

# ── 3. Preparar diretorios no VPS ────────────────────────────────────────────
Write-Step "3/5 - Preparando VPS..."
ssh "${VPS_USER}@${VPS_IP}" "mkdir -p ${VPS_PATH}/backend ${VPS_PATH}/frontend"
Write-Success "Pastas OK!"

# ── 4. Enviar arquivos ────────────────────────────────────────────────────────
Write-Step "4/5 - Enviando arquivos para VPS..."

if ($backend) {
    Write-Host "  -> backend/src/" -ForegroundColor Gray
    scp -r ./backend/src "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"

    Write-Host "  -> backend/migrations/ (limpando antes para remover arquivos obsoletos)" -ForegroundColor Gray
    ssh "${VPS_USER}@${VPS_IP}" "rm -rf ${VPS_PATH}/backend/migrations"
    scp -r ./backend/migrations "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"

    Write-Host "  -> backend/package*.json, Dockerfile, .dockerignore" -ForegroundColor Gray
    scp ./backend/package.json         "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"
    scp ./backend/package-lock.json    "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"
    scp ./backend/Dockerfile           "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"
    scp ./backend/.dockerignore        "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/"

    Write-Host "  -> docker-compose.yml" -ForegroundColor Gray
    scp ./docker-compose.yml "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"

    Write-Host "  -> .env.example" -ForegroundColor Gray
    scp ./.env.example "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
}

if ($frontend) {
    # Vite gera em frontend/dist/ (nao mais dist/agendaumento/browser/ do Angular)
    Write-Host "  -> frontend/dist/ -> VPS ~/agendaumento/frontend/" -ForegroundColor Gray
    scp -r ./frontend/dist/* "${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/"
}

Write-Success "Arquivos enviados!"

# ── 5. Rebuild containers no VPS ─────────────────────────────────────────────
if ($backend) {
    Write-Step "5/5 - Reconstruindo containers Docker..."

    ssh "${VPS_USER}@${VPS_IP}" @"
cd ${VPS_PATH}

if [ ! -f .env ]; then
    echo ''
    echo '[ERRO] Arquivo .env nao encontrado!'
    echo 'Execute no VPS:'
    echo '  cd ${VPS_PATH}'
    echo '  cp .env.example .env'
    echo '  nano .env   # preencha DB_PASSWORD, JWT_SECRET, etc.'
    exit 1
fi

docker compose down
docker compose up -d --build

echo ''
echo '=== Status dos containers ==='
docker compose ps

echo ''
echo '=== Teste da API ==='
sleep 3
curl -sf http://localhost:3000/api/health && echo 'API OK!' || echo 'API ainda iniciando...'
"@

    if ($LASTEXITCODE -ne 0) {
        Write-Err "Erro no VPS. Logs: ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose logs --tail=50'"
        exit 1
    }
} else {
    Write-Step "5/5 - Rebuild containers... PULADO"
    # Apenas frontend: recarregar Nginx
    ssh "${VPS_USER}@${VPS_IP}" "sudo nginx -t && sudo systemctl reload nginx"
    Write-Success "Nginx recarregado!"
}

# ── Concluido ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Deploy concluido com sucesso!"         -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Site: https://agendaumento.couriersknowledge.com"       -ForegroundColor Cyan
Write-Host "API:  https://agendaumento.couriersknowledge.com/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos uteis no VPS:" -ForegroundColor Gray
Write-Host "  Logs:    ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose logs -f'"   -ForegroundColor Gray
Write-Host "  Status:  ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose ps'"        -ForegroundColor Gray
Write-Host "  Restart: ssh ${VPS_USER}@${VPS_IP} 'cd ${VPS_PATH} && docker compose restart'"   -ForegroundColor Gray
Write-Host ""
