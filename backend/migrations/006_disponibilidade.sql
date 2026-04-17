-- Regras de disponibilidade semanal (admin configura)
-- dia_semana: 0=domingo, 1=segunda ... 6=sábado
CREATE TABLE IF NOT EXISTS disponibilidade (
  id          SERIAL PRIMARY KEY,
  dia_semana  SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fim    TIME NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(dia_semana, hora_inicio)
);

-- Períodos bloqueados (feriados, férias, etc.)
CREATE TABLE IF NOT EXISTS periodos_bloqueados (
  id         SERIAL PRIMARY KEY,
  data_inicio DATE NOT NULL,
  data_fim    DATE NOT NULL,
  motivo      VARCHAR(255),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (data_fim >= data_inicio)
);
