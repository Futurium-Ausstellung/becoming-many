/**
 * Decide what the masthead reload reminder says after a page has run for a while.
 * Long-running pages slowly lose performance; a fresh document restores it. The
 * reminder only recommends: the operator chooses the moment between visitors.
 */

export interface ReloadReminderState {
  /** Whole seconds left until a reload is recommended; zero once it is. */
  readonly remainingSeconds: number;
  readonly isDue: boolean;
}

export function resolveReloadReminder(
  elapsedMilliseconds: number,
  intervalMilliseconds: number,
): ReloadReminderState {
  const remaining = intervalMilliseconds - Math.max(elapsedMilliseconds, 0);
  if (remaining <= 0) return { remainingSeconds: 0, isDue: true };
  // Round up so the readout reaches 0:00 only at the moment it becomes due.
  return { remainingSeconds: Math.ceil(remaining / 1_000), isDue: false };
}
