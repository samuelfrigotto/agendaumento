-- Controle de notificações enviadas (evita duplicatas)
CREATE TABLE IF NOT EXISTS notificacoes (
  id             SERIAL PRIMARY KEY,
  agendamento_id INTEGER NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  tipo           VARCHAR(20) NOT NULL CHECK (tipo IN ('email', 'whatsapp')),
  momento        VARCHAR(20) NOT NULL CHECK (momento IN ('dia_antes', '2h_antes')),
  enviado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agendamento_id, tipo, momento)
);
