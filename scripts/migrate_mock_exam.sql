-- Таблиця спроб тренувального іспиту ГСЦ МВС (mock-exam).
-- Зберігаємо всю інформацію щоб мати можливість показати детальний пост-аналіз.

CREATE TABLE IF NOT EXISTS pdr_mock_exam_attempts (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES pdr_users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ NOT NULL,
  duration_sec    INTEGER NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 20,
  correct_count   INTEGER NOT NULL,
  wrong_count     INTEGER NOT NULL,
  passed          BOOLEAN NOT NULL,
  questions       JSONB NOT NULL,  -- масив id питань у тому порядку як їх показали
  answers         JSONB NOT NULL   -- масив {questionId, answerId, isCorrect}
);

CREATE INDEX IF NOT EXISTS idx_pdr_mock_exam_user
  ON pdr_mock_exam_attempts(user_id, finished_at DESC);
