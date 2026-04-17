-- Add icon column to servicos table
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'scissors';
