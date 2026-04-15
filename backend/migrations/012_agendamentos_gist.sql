-- Migration 012: Anti-double-booking via EXCLUDE USING GIST
-- Adiciona ends_at calculado e constraint de exclusao no banco
-- Isso e a segunda camada de protecao (a primeira e o check na aplicacao)

-- btree_gist permite usar operador = em colunas UUID dentro de um indice GIST
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Coluna ends_at: calculada automaticamente a partir de data_hora + duracao_min
-- STORED = persistida no disco, pode ser indexada
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP
  GENERATED ALWAYS AS (data_hora + (duracao_min * interval '1 minute')) STORED;

-- Indice GIST para acelerar queries de disponibilidade
CREATE INDEX IF NOT EXISTS idx_agendamentos_gist_range
  ON agendamentos USING GIST (
    banhista_id,
    tsrange(data_hora, ends_at)
  );

-- Constraint de exclusao: dois agendamentos ativos nao podem se sobrepor
-- para o mesmo banhista_id. Cancelados e concluidos liberam o slot.
-- NOTA: vai falhar se ja existirem agendamentos sobrepostos com status ativo.
--       Limpe manualmente antes se necessario.
ALTER TABLE agendamentos
  ADD CONSTRAINT no_double_booking
  EXCLUDE USING GIST (
    banhista_id WITH =,
    tsrange(data_hora, ends_at) WITH &&
  ) WHERE (status IN ('agendado', 'confirmado', 'em_andamento'));
