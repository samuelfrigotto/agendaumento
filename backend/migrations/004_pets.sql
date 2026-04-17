-- Pets vinculados a clientes
CREATE TABLE IF NOT EXISTS pets (
  id              SERIAL PRIMARY KEY,
  cliente_id      INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo_animal_id  INTEGER NOT NULL REFERENCES tipos_animais(id),
  nome            VARCHAR(100) NOT NULL,
  raca            VARCHAR(100),
  idade           INTEGER,
  observacoes     TEXT,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_cliente ON pets(cliente_id);
