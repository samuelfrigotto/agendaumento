-- Migration 009: Categorias de Servicos

-- Adicionar coluna categoria na tabela servicos
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'banho_tosa';

-- Valores possiveis: consulta, exame, cirurgia, banho_tosa, vacina, internacao, outro

-- Atualizar servicos existentes baseado no nome (heuristica)
UPDATE servicos SET categoria = 'consulta' WHERE LOWER(nome) LIKE '%consult%';
UPDATE servicos SET categoria = 'exame' WHERE LOWER(nome) LIKE '%exame%' OR LOWER(nome) LIKE '%raio%' OR LOWER(nome) LIKE '%ultra%';
UPDATE servicos SET categoria = 'cirurgia' WHERE LOWER(nome) LIKE '%cirurg%' OR LOWER(nome) LIKE '%castra%';
UPDATE servicos SET categoria = 'vacina' WHERE LOWER(nome) LIKE '%vacin%';
UPDATE servicos SET categoria = 'internacao' WHERE LOWER(nome) LIKE '%intern%';

-- Adicionar campos extras para pets (veterinaria)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS alergias TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS condicoes_medicas TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS castrado BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS microchip VARCHAR(50);

-- Indice para categoria
CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria);
