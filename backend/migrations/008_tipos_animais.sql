-- Migration 008: Tipos de Animais (especies e racas configuraveis)

CREATE TABLE IF NOT EXISTS tipos_animais (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id     UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  especie         VARCHAR(50) NOT NULL,
  raca            VARCHAR(100),
  ativo           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMP DEFAULT NOW(),
  UNIQUE(banhista_id, especie, raca)
);

CREATE INDEX IF NOT EXISTS idx_tipos_animais_banhista ON tipos_animais(banhista_id);
CREATE INDEX IF NOT EXISTS idx_tipos_animais_especie ON tipos_animais(especie);

-- Inserir tipos padrao para banhistas existentes
INSERT INTO tipos_animais (banhista_id, especie, raca)
SELECT b.id, especie, raca
FROM banhistas b
CROSS JOIN (
  VALUES
    ('cachorro', 'SRD'),
    ('cachorro', 'Poodle'),
    ('cachorro', 'Shih Tzu'),
    ('cachorro', 'Yorkshire'),
    ('cachorro', 'Maltês'),
    ('cachorro', 'Lhasa Apso'),
    ('cachorro', 'Golden Retriever'),
    ('cachorro', 'Labrador'),
    ('cachorro', 'Bulldog'),
    ('cachorro', 'Pug'),
    ('cachorro', 'Spitz Alemão'),
    ('cachorro', 'Outro'),
    ('gato', 'SRD'),
    ('gato', 'Persa'),
    ('gato', 'Siamês'),
    ('gato', 'Maine Coon'),
    ('gato', 'Outro'),
    ('ave', NULL),
    ('roedor', NULL),
    ('reptil', NULL),
    ('outro', NULL)
) AS tipos(especie, raca)
ON CONFLICT DO NOTHING;
