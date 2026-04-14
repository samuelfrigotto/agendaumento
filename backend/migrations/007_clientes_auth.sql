-- Migration 007: Adicionar campos de autenticacao para clientes

-- Adicionar campos de auth na tabela clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS email_auth VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();

-- Indices para login
CREATE INDEX IF NOT EXISTS idx_clientes_email_auth ON clientes(email_auth);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);

-- Nota: email_auth e separado de email para nao quebrar dados existentes do CRM
-- email_auth = credencial de login do cliente
-- email = email de contato usado pelo banhista
