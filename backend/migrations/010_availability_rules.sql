-- Migration 010: Regras de disponibilidade semanal
-- Define quando a clinica atende, por dia da semana
-- day_of_week: 0 = domingo, 1 = segunda, ..., 6 = sabado

CREATE TABLE IF NOT EXISTS availability_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id  UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  ativo        BOOLEAN NOT NULL DEFAULT true,
  criado_em    TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_window CHECK (end_time > start_time),
  CONSTRAINT unique_rule UNIQUE (banhista_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_banhista_day
  ON availability_rules(banhista_id, day_of_week);

-- Inserir horarios padrao para banhistas existentes:
-- Segunda a Sexta: 08:00-18:00 | Sabado: 08:00-12:00 | Domingo: fechado
INSERT INTO availability_rules (banhista_id, day_of_week, start_time, end_time)
SELECT b.id, d.dow, d.st::TIME, d.et::TIME
FROM banhistas b
CROSS JOIN (VALUES
  (1, '08:00', '18:00'),
  (2, '08:00', '18:00'),
  (3, '08:00', '18:00'),
  (4, '08:00', '18:00'),
  (5, '08:00', '18:00'),
  (6, '08:00', '12:00')
) AS d(dow, st, et)
ON CONFLICT DO NOTHING;
