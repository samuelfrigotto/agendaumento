# ============================================
# AGENDAUMENTO API - Dockerfile
# ============================================

# Imagem base Node.js Alpine (leve)
FROM node:20-alpine

# Instalar dependencias do sistema para sharp (processamento de imagem)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

# Criar diretorio da aplicacao
WORKDIR /app

# Copiar arquivos de dependencias primeiro (melhor cache)
COPY package*.json ./

# Instalar dependencias de producao
# Usa npm install (npm ci requer package-lock.json)
RUN npm install --omit=dev

# Copiar codigo fonte
COPY . .

# Criar pasta de uploads
RUN mkdir -p /app/uploads

# Usuario non-root para seguranca
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Porta da aplicacao
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

# Comando para iniciar
CMD ["node", "src/server.js"]
