import type { Run } from "../../levels/run-contract";
import type { M5Observation } from "../../m5/m5-contract";
import { M5_FIRMWARE_VERSION } from "../../m5/protocol";
import { requireElement, writeAttribute, writeText } from "../shared/dom";
import {
  type ConductorCopy,
  OPERATOR_LANGUAGES,
  type OperatorLanguage,
} from "./conductor-copy";
import { bindConfirmation } from "./confirmation";
import { CONDUCTOR_SETTINGS } from "./operator-settings";
import type { ConductorPanel } from "./view-state";

export interface TechDrawerOptions {
  readonly parent: HTMLElement;
  readonly trigger: HTMLButtonElement;
  readonly signal: AbortSignal;
  readonly run: Pick<Run, "show" | "resetFlight">;
  readonly reloadPage: () => void;
  /** The page's own language; the narration language is a separate choice. */
  readonly onOperatorLanguageChange: (language: OperatorLanguage) => void;
}

export interface TechDrawer {
  /** Where the M5 host panel mounts, below the resets. */
  readonly m5Parent: HTMLElement;
  readonly panel: ConductorPanel;
}

export function createTechDrawer({
  parent,
  trigger,
  signal,
  run,
  reloadPage,
  onOperatorLanguageChange,
}: TechDrawerOptions): TechDrawer {
  const root = requireElement(parent, ".conductor__drawer", HTMLDialogElement);
  const closeButton = requireElement(
    root,
    ".conductor__drawer-close",
    HTMLButtonElement,
  );
  trigger.addEventListener(
    "click",
    () => {
      root.showModal();
      trigger.setAttribute("aria-expanded", "true");
    },
    { signal },
  );
  function close(): void {
    root.close();
    trigger.setAttribute("aria-expanded", "false");
  }
  closeButton.addEventListener("click", close, { signal });
  root.addEventListener(
    "cancel",
    () => {
      trigger.setAttribute("aria-expanded", "false");
    },
    { signal },
  );
  signal.addEventListener("abort", close, { once: true });
  const m5Parent = requireElement(root, "[data-m5-parent]", HTMLElement);
  const rateButtons = CONDUCTOR_SETTINGS.timeScales.map((timeScale) => {
    const button = requireElement(
      root,
      `[data-time-scale="${timeScale}"]`,
      HTMLButtonElement,
    );
    button.addEventListener("click", () => run.show?.setTimeScale(timeScale), {
      signal,
    });
    return button;
  });
  const resetShow = requireElement(
    root,
    "[data-reset-show]",
    HTMLButtonElement,
  );
  resetShow.addEventListener("click", () => run.show?.resetTime(), {
    signal,
  });
  requireElement(
    root,
    "[data-reset-flight]",
    HTMLButtonElement,
  ).addEventListener("click", run.resetFlight, { signal });
  const reload = bindConfirmation(
    requireElement(root, ".conductor__reload-button", HTMLButtonElement),
    "Tap again to reload",
    reloadPage,
    signal,
  );
  const operatorLanguageButtons = OPERATOR_LANGUAGES.map((operatorLanguage) => {
    const button = requireElement(
      root,
      `[data-operator-language="${operatorLanguage}"]`,
      HTMLButtonElement,
    );
    button.addEventListener(
      "click",
      () => onOperatorLanguageChange(operatorLanguage),
      { signal },
    );
    return button;
  });
  let appliedCopy: ConductorCopy | undefined;
  const controllerState = requireElement(
    root,
    "[data-m5-state]",
    HTMLPreElement,
  );
  requireElement(
    root,
    "[data-m5-bundled-firmware]",
    HTMLOutputElement,
  ).textContent = M5_FIRMWARE_VERSION;
  let receivedState: M5Observation["receivedState"];
  const m5 = readOutput(root, "m5");
  const level = readOutput(root, "level");
  const audio = readOutput(root, "audio");
  const language = readOutput(root, "language");

  return {
    m5Parent,
    panel: {
      update(state): void {
        const available = !!run.show;
        resetShow.disabled = !available;
        rateButtons.forEach((button, index) => {
          button.disabled = !available;
          button.setAttribute(
            "aria-pressed",
            String(CONDUCTOR_SETTINGS.timeScales[index] === state.timeScale),
          );
        });

        operatorLanguageButtons.forEach((button, index) => {
          writeAttribute(
            button,
            "aria-pressed",
            String(OPERATOR_LANGUAGES[index] === state.copy.language),
          );
        });

        writeText(m5, m5Text(state.m5));
        const copyChanged = appliedCopy !== state.copy;
        if (copyChanged) {
          appliedCopy = state.copy;
          reload.setLabels(
            state.copy.drawer.reload,
            state.copy.drawer.reloadArmed,
          );
        }
        if (copyChanged || receivedState !== state.m5?.receivedState) {
          receivedState = state.m5?.receivedState;
          writeText(
            controllerState,
            receivedState
              ? JSON.stringify(receivedState, null, 2)
              : state.copy.drawer.noControllerResponse,
          );
        }
        writeText(level, state.activeLevel);
        writeText(audio, state.audioState);
        writeText(language, state.language?.toUpperCase() ?? "—");
      },
    },
  };
}

function readOutput(parent: HTMLElement, name: string): HTMLOutputElement {
  return requireElement(parent, `[data-reading="${name}"]`, HTMLOutputElement);
}

/**
 * The Controller tile shows connection freshness.
 */
function m5Text(status: M5Observation | undefined): string {
  if (status === undefined || status.status === "off") return "—";

  if (status.status !== "live") return status.status.replaceAll("-", " ");

  return "live";
}
