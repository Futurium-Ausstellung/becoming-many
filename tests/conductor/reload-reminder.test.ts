/**
 * Purpose: Pin the masthead reload reminder's countdown to elapsed page time.
 * Context: Long-running pages lose performance; the operator reloads by hand.
 * Responsibility: Cover the countdown, its rounding and the due state.
 * Boundary: Words live in the conductor copy; the DOM lives in the panel.
 */

import { describe, expect, test } from "bun:test";
import { resolveReloadReminder } from "../../src/ui/conductor/reload-reminder-state";

const HOUR = 60 * 60 * 1_000;

describe("resolveReloadReminder", () => {
  test("starts with the whole interval left", () => {
    expect(resolveReloadReminder(0, HOUR)).toEqual({
      remainingSeconds: 3_600,
      isDue: false,
    });
  });

  test("rounds partial seconds up so zero means due", () => {
    expect(resolveReloadReminder(HOUR - 1, HOUR)).toEqual({
      remainingSeconds: 1,
      isDue: false,
    });
    expect(resolveReloadReminder(1_500, HOUR).remainingSeconds).toBe(3_599);
  });

  test("becomes due when the interval has passed and stays due", () => {
    expect(resolveReloadReminder(HOUR, HOUR)).toEqual({
      remainingSeconds: 0,
      isDue: true,
    });
    expect(resolveReloadReminder(5 * HOUR, HOUR).isDue).toBe(true);
  });

  test("reads a negative elapsed time as the start", () => {
    expect(resolveReloadReminder(-10, HOUR).remainingSeconds).toBe(3_600);
  });
});
