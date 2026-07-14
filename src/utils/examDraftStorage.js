const PREFIX = 'ic3_exam_draft_';

/**
 * localStorage mirror of exam_attempts.draft_answers. The Supabase ping in
 * ExamPage/MockExamPage is throttled to 4s, so a dropped connection or a tab
 * closed mid-window can lose an answer server-side; this write is synchronous
 * and un-throttled, so on resume we can merge it back in as a safety net.
 */
export function readExamDraft(attemptId) {
  if (!attemptId) return null;
  try {
    const raw = localStorage.getItem(PREFIX + attemptId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeExamDraft(attemptId, { answers, flagged, currentIndex }) {
  if (!attemptId) return;
  try {
    localStorage.setItem(PREFIX + attemptId, JSON.stringify({ answers, flagged, currentIndex }));
  } catch {
    // localStorage full/disabled — server-side draft_answers remains source of truth
  }
}

export function clearExamDraft(attemptId) {
  if (!attemptId) return;
  try {
    localStorage.removeItem(PREFIX + attemptId);
  } catch {
    // ignore
  }
}

/** Merge a locally-cached draft on top of the server draft — local always wins
 * per-key since it can only be newer than the last successful server ping. */
export function mergeExamDraft(serverDraft, localDraft) {
  if (!localDraft) return serverDraft;
  const serverAnswers = serverDraft?.answers || {};
  const serverFlagged = serverDraft?.flagged || [];
  const answers = { ...serverAnswers, ...(localDraft.answers || {}) };
  const flagged = Array.from(new Set([...serverFlagged, ...(localDraft.flagged || [])]));
  const currentIndex = Math.max(serverDraft?.currentIndex ?? 0, localDraft.currentIndex ?? 0);
  return { answers, flagged, currentIndex };
}
