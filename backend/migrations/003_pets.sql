-- Migration 003: Pets

CREATE TABLE IF NOT EXISTS pets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  banhista_id     UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  nome            VARCHAR(100) NOT NULL,
  especie         VARCHAR(50) DEFAULT 'cachorro',
  raca            VARCHAR(100),
  tamanho         VARCHAR(20),
  peso_kg         DECIMAL(5,2),
  foto_url        VARCHAR(500),
  observacoes     TEXT,
  criado_em       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_cliente ON pets(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pets_banhista ON pets(banhista_id);
