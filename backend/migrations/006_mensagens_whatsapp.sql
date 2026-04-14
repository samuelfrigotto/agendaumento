-- Migration 006: Mensagens WhatsApp (log)

CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id     UUID NOT NULL REFERENCES banhistas(id),
  agendamento_id  UUID REFERENCES agendamentos(id),
  telefone_destino VARCHAR(20) NOT NULL,
  tipo            VARCHAR(50),
  mensagem        TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'enviado',
  enviado_em      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_banhista ON mensagens_whatsapp(banhista_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_agendamento ON mensagens_whatsapp(agendamento_id);
