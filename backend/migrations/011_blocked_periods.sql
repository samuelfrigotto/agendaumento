-- Migration 011: Periodos bloqueados
-- Feriados, ferias, emergencias — sobrepoe as regras semanais
-- Admin bloqueia um intervalo; agendamentos existentes nao sao cancelados automaticamente

CREATE TABLE IF NOT EXISTS blocked_periods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  starts_at   TIMESTAMP NOT NULL,
  ends_at     TIMESTAMP NOT NULL,
  reason      TEXT,
  criado_em   TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_block CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_blocked_banhista_range
  ON blocked_periods(banhista_id, starts_at, ends_at);
