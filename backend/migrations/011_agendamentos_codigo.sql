-- Código alfanumérico de 5 caracteres para agendamentos (exibição ao cliente)
CREATE OR REPLACE FUNCTION gerar_codigo_agendamento() RETURNS VARCHAR(5) AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i      INT;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Adiciona coluna (nullable primeiro para não quebrar linhas existentes)
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS codigo VARCHAR(5);

-- Preenche registros sem código
UPDATE agendamentos SET codigo = gerar_codigo_agendamento() WHERE codigo IS NULL;

-- Garante unicidade e obrigatoriedade
ALTER TABLE agendamentos ALTER COLUMN codigo SET DEFAULT gerar_codigo_agendamento();
ALTER TABLE agendamentos ALTER COLUMN codigo SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agendamentos_codigo_unique'
  ) THEN
    ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_codigo_unique UNIQUE (codigo);
  END IF;
END $$;
