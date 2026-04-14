-- Migration 004: Serviços (catálogo da banhista)

CREATE TABLE IF NOT EXISTS servicos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id     UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  nome            VARCHAR(150) NOT NULL,
  duracao_min     INTEGER NOT NULL,
  preco_pequeno   DECIMAL(8,2),
  preco_medio     DECIMAL(8,2),
  preco_grande    DECIMAL(8,2),
  preco_gigante   DECIMAL(8,2),
  ativo           BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_servicos_banhista ON servicos(banhista_id);
