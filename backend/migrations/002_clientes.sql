-- Migration 002: Clientes (donos dos pets)

CREATE TABLE IF NOT EXISTS clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id     UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  nome            VARCHAR(150) NOT NULL,
  telefone        VARCHAR(20) NOT NULL,
  email           VARCHAR(255),
  observacoes     TEXT,
  criado_em       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_banhista ON clientes(banhista_id);
