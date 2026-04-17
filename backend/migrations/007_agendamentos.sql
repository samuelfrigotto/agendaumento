-- Agendamentos
CREATE TYPE agendamento_status AS ENUM ('pendente', 'confirmado', 'concluido', 'cancelado');
CREATE TYPE agendamento_origem AS ENUM ('cliente', 'admin');

CREATE TABLE IF NOT EXISTS agendamentos (
  id             SERIAL PRIMARY KEY,
  cliente_id     INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  pet_id         INTEGER REFERENCES pets(id) ON DELETE SET NULL,
  servico_id     INTEGER NOT NULL REFERENCES servicos(id),
  data_hora      TIMESTAMPTZ NOT NULL,
  status         agendamento_status NOT NULL DEFAULT 'pendente',
  origem         agendamento_origem NOT NULL DEFAULT 'cliente',
  -- Para agendamentos do admin sem cliente cadastrado
  nome_avulso    VARCHAR(150),
  telefone_avulso VARCHAR(20),
  pet_nome_avulso VARCHAR(100),
  observacoes    TEXT,
  valor_cobrado  NUMERIC(10,2),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
