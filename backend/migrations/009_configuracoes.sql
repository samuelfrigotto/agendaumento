-- Configurações dinâmicas (SMTP, WhatsApp) - armazenadas como chave/valor
CREATE TABLE IF NOT EXISTS configuracoes (
  chave     VARCHAR(100) PRIMARY KEY,
  valor     TEXT,
  descricao VARCHAR(255),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defaults
INSERT INTO configuracoes (chave, descricao) VALUES
  ('smtp_host',         'Host do servidor SMTP'),
  ('smtp_port',         'Porta SMTP'),
  ('smtp_user',         'Usuário SMTP'),
  ('smtp_pass',         'Senha SMTP'),
  ('smtp_from',         'E-mail remetente'),
  ('smtp_ativo',        'Notificações por e-mail ativas (true/false)'),
  ('whatsapp_api_url',  'URL da Evolution API'),
  ('whatsapp_api_key',  'Chave de autenticação da Evolution API'),
  ('whatsapp_instance', 'Nome da instância WhatsApp'),
  ('whatsapp_ativo',    'Notificações por WhatsApp ativas (true/false)')
ON CONFLICT (chave) DO NOTHING;
