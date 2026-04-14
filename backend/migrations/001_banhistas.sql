-- Migration 001: Tabela de Banhistas (usuárias do sistema)

CREATE TABLE IF NOT EXISTS banhistas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(150) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  senha_hash      VARCHAR(255) NOT NULL,
  telefone        VARCHAR(20),
  nome_negocio    VARCHAR(200),
  whatsapp_numero VARCHAR(20),
  plano           VARCHAR(20) DEFAULT 'trial',
  trial_fim       TIMESTAMP,
  ativo           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMP DEFAULT NOW(),
  atualizado_em   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banhistas_email ON banhistas(email);
