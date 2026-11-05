/**
 * Purpose: Pin the headset button's state to the XR session state.
 * Context: One label answers "can I start the headset picture right now".
 * Responsibility: Cover the whole availability × session matrix.
 * Boundary: The word for each state lives in the conductor copy; the DOM
 *   around it lives in the headset panel. Both untested by design.
 */

import { describe, expect, test } from "bun:test";
import { resolveStreamButton } from "../../src/ui/conductor/headset-button-state";

describe("resolveStreamButton", () => {
  test("offers the start while a headset runtime is available", () => {
    expect(
      resolveStreamButton({
        availability: "available",
        isSessionActive: false,
      }),
    ).toEqual({ label: "off", isEnabled: true });
  });

  test("offers the stop while a session runs", () => {
    expect(
      resolveStreamButton({ availability: "available", isSessionActive: true }),
    ).toEqual({ label: "on", isEnabled: true });
  });

  test("keeps the stop even if availability drops mid-session", () => {
    expect(
      resolveStreamButton({
        availability: "unsupported",
        isSessionActive: true,
      }),
    ).toEqual({ label: "on", isEnabled: true });
  });

  test("disables itself without a runtime", () => {
    expect(
      resolveStreamButton({
        availability: "unsupported",
        isSessionActive: false,
      }),
    ).toEqual({ label: "unavailable", isEnabled: false });
  });

  test("reads as unavailable while the support check is still out", () => {
    expect(
      resolveStreamButton({ availability: "unknown", isSessionActive: false }),
    ).toEqual({ label: "unavailable", isEnabled: false });
  });
});
