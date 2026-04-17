-- Tabela de clientes (usuários do app)
CREATE TABLE IF NOT EXISTS clientes (
  id           SERIAL PRIMARY KEY,
  nome         VARCHAR(150) NOT NULL,
  cpf          VARCHAR(14)  NOT NULL UNIQUE,
  telefone     VARCHAR(20)  NOT NULL,
  endereco     VARCHAR(255),
  email        VARCHAR(150) UNIQUE,
  senha_hash   VARCHAR(255) NOT NULL,
  ativo        BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
