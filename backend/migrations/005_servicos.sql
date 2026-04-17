-- Serviços disponíveis na clínica
CREATE TABLE IF NOT EXISTS servicos (
  id              SERIAL PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  descricao       TEXT,
  preco           NUMERIC(10,2) NOT NULL DEFAULT 0,
  duracao_minutos INTEGER NOT NULL DEFAULT 60,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relação serviços x tipos de animais aceitos
CREATE TABLE IF NOT EXISTS servicos_tipos_animais (
  servico_id     INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  tipo_animal_id INTEGER NOT NULL REFERENCES tipos_animais(id) ON DELETE CASCADE,
  PRIMARY KEY (servico_id, tipo_animal_id)
);
