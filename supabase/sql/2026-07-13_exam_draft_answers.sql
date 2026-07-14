-- Persist in-progress exam answers/flags so resuming an exam restores full
-- state (answers + flagged questions), not just the current question index.
-- See docs/PATTERNS_AND_CONVENTIONS.md #22 Resume Session Pattern.
ALTER TABLE exam_attempts
  ADD COLUMN IF NOT EXISTS draft_answers jsonb NOT NULL DEFAULT '{}'::jsonb;
