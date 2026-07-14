-- One-time full wipe of exam attempt history (requested 2026-07-13).
-- Cascades automatically to attempt_answers + exam_cheat_events via
-- ON DELETE CASCADE FKs (see 2026-07-08_six_features.sql for exam_cheat_events,
-- DATABASE_SCHEMA.md for attempt_answers).
-- Does NOT touch purchases/payment_history — those are financial records,
-- a separate domain from "lich su lam bai" (exam attempt history).
-- Run manually via Supabase Studio SQL editor (no CLI/migrations wired up in this repo).

DELETE FROM exam_attempts;
