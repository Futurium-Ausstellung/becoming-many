import { writeText } from "../shared/dom";
import { CONDUCTOR_SETTINGS } from "./operator-settings";

export interface Confirmation {
  /** Replace both labels, keeping whichever one the current state shows. */
  readonly setLabels: (label: string, armedLabel: string) => void;
}

/** Bind a press-twice action; abort clears its timer and restores its label. */
export function bindConfirmation(
  button: HTMLButtonElement,
  armedLabel: string,
  onConfirm: () => void,
  signal: AbortSignal,
): Confirmation {
  let label = button.textContent;
  let armed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function show(): void {
    writeText(button, armed ? armedLabel : label);
  }
  function disarm(): void {
    clearTimeout(timer);
    armed = false;
    button.dataset.armed = "false";
    show();
  }
  signal.addEventListener("abort", disarm, { once: true });
  button.addEventListener(
    "click",
    () => {
      if (armed) {
        disarm();
        onConfirm();
        return;
      }
      armed = true;
      button.dataset.armed = "true";
      show();
      timer = setTimeout(disarm, CONDUCTOR_SETTINGS.confirmMilliseconds);
    },
    { signal },
  );
  return {
    setLabels(nextLabel, nextArmedLabel): void {
      label = nextLabel;
      armedLabel = nextArmedLabel;
      show();
    },
  };
}
