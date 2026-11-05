/** Project actual XR session state into the main operator picture button. */

import type { XrSessionState } from "../../world/xr-contract";
import type { PictureLabel } from "./conductor-copy";

export interface StreamButtonView {
  /** The session state the button shows; the copy turns it into a word. */
  readonly label: Extract<PictureLabel, "on" | "off" | "unavailable">;
  readonly isEnabled: boolean;
}

export function resolveStreamButton(state: XrSessionState): StreamButtonView {
  // An active session always offers its own end, whatever availability says:
  // a runtime that vanishes mid-session must not strand the stop control.
  if (state.isSessionActive) {
    return { label: "on", isEnabled: true };
  }
  if (state.availability === "available") {
    return { label: "off", isEnabled: true };
  }

  return { label: "unavailable", isEnabled: false };
}
