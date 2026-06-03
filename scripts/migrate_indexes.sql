-- Додаткові індекси для прискорення запитів на головній сторінці
-- та readiness widget. Без них SELECT ... ORDER BY answered_at робить
-- повний скан таблиці що повільно при сотнях/тисячах рядків.

CREATE INDEX IF NOT EXISTS pdr_answer_history_user_answered_idx
  ON pdr_answer_history (user_id, answered_at DESC);

CREATE INDEX IF NOT EXISTS pdr_answer_history_user_q_answered_idx
  ON pdr_answer_history (user_id, question_id, answered_at DESC);
