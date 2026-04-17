-- Tipos de animais aceitos na clínica
CREATE TABLE IF NOT EXISTS tipos_animais (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(80) NOT NULL UNIQUE,
  ativo     BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Padrão inicial
INSERT INTO tipos_animais (nome) VALUES
  ('Cachorro'),
  ('Gato')
ON CONFLICT (nome) DO NOTHING;
