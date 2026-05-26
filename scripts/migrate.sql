-- Схема для ПДР додатку. Префікс pdr_ щоб не конфліктувати з іншими проєктами в тій же базі.

CREATE TABLE IF NOT EXISTS pdr_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdr_answer_history (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES pdr_users(id) ON DELETE CASCADE,
  question_id INT NOT NULL,
  selected_answer_id INT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pdr_answer_history_user_idx
  ON pdr_answer_history (user_id, question_id);

CREATE INDEX IF NOT EXISTS pdr_answer_history_user_correct_idx
  ON pdr_answer_history (user_id, is_correct, answered_at DESC);

CREATE TABLE IF NOT EXISTS pdr_progress (
  user_id INT NOT NULL REFERENCES pdr_users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  current_index INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, mode)
);

CREATE TABLE IF NOT EXISTS pdr_bookmarks (
  user_id INT NOT NULL REFERENCES pdr_users(id) ON DELETE CASCADE,
  question_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);
