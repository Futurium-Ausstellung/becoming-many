/**
 * Bind the masthead reload reminder: count down from page start, then offer one
 * tap that reloads the whole page. Entry owns the reload itself.
 */
import { requireElement, writeAttribute, writeText } from "../shared/dom";
import { formatShowTime } from "../shared/show-time-format";
import { CONDUCTOR_SETTINGS } from "./operator-settings";
import { resolveReloadReminder } from "./reload-reminder-state";
import type { ConductorPanel } from "./view-state";

interface ReloadReminderOptions {
  readonly parent: HTMLElement;
  readonly reloadPage: () => void;
  readonly signal: AbortSignal;
}

export function createReloadReminder({
  parent,
  reloadPage,
  signal,
}: ReloadReminderOptions): ConductorPanel {
  const button = requireElement(
    parent,
    ".conductor__reload-reminder",
    HTMLButtonElement,
  );
  const label = requireElement(button, "[data-reminder-label]", HTMLElement);
  const value = requireElement(button, "[data-reminder-value]", HTMLElement);
  const startedAt = performance.now();
  let isDue = false;

  button.addEventListener(
    "click",
    () => {
      if (isDue) reloadPage();
    },
    { signal },
  );

  return {
    update(state): void {
      const reminder = resolveReloadReminder(
        performance.now() - startedAt,
        CONDUCTOR_SETTINGS.reloadReminderMilliseconds,
      );
      isDue = reminder.isDue;
      const words = state.copy.reloadReminder;
      button.disabled = !isDue;
      if (button.dataset.due !== String(isDue))
        button.dataset.due = String(isDue);
      writeText(label, isDue ? words.due : words.pending);
      writeText(
        value,
        isDue ? words.action : formatShowTime(reminder.remainingSeconds),
      );
      writeAttribute(
        button,
        "title",
        isDue ? words.dueTitle : words.pendingTitle,
      );
    },
  };
}
