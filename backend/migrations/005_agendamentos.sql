-- Migration 005: Agendamentos (tabela central)

CREATE TABLE IF NOT EXISTS agendamentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id     UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  pet_id          UUID NOT NULL REFERENCES pets(id),
  cliente_id      UUID NOT NULL REFERENCES clientes(id),
  servico_id      UUID REFERENCES servicos(id),
  data_hora       TIMESTAMP NOT NULL,
  duracao_min     INTEGER NOT NULL DEFAULT 60,
  preco           DECIMAL(8,2),
  status          VARCHAR(30) DEFAULT 'agendado',
  observacoes     TEXT,
  aviso_enviado   BOOLEAN DEFAULT false,
  foto_pronto_url VARCHAR(500),
  forma_pagamento VARCHAR(30),
  pago            BOOLEAN DEFAULT false,
  criado_em       TIMESTAMP DEFAULT NOW(),
  atualizado_em   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_banhista_data ON agendamentos(banhista_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_pet ON agendamentos(pet_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos(cliente_id);
