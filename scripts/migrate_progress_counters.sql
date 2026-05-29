-- Додаю колонки лічильників до pdr_progress
ALTER TABLE pdr_progress ADD COLUMN IF NOT EXISTS correct_count INT NOT NULL DEFAULT 0;
ALTER TABLE pdr_progress ADD COLUMN IF NOT EXISTS wrong_count INT NOT NULL DEFAULT 0;
