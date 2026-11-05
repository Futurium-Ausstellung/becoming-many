/**
 * Purpose: Keep both languages of the conductor page complete.
 * Context: A station is read in one language all evening; a missing word
 *   would be found by staff mid-show rather than here.
 * Responsibility: Cover every catalogue leaf, every declared HTML copy key,
 *   and the chapter names against the piece's own cue ids.
 * Boundary: How each word reads is an editorial choice, not a test's; only
 *   presence, distinctness, and coverage are asserted.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PIECE_SCHEDULE } from "../../src/dramaturgy/piece-schedule";
import {
  CHAPTER_NAMES,
  CONDUCTOR_COPY,
  type ConductorCopy,
  OPERATOR_LANGUAGES,
} from "../../src/ui/conductor/conductor-copy";

const CONDUCTOR_HTML = readFileSync(
  join(import.meta.dirname, "../../src/ui/conductor.html"),
  "utf8",
);

/** Every string a catalogue holds, including the ones behind functions. */
function readWords(copy: ConductorCopy): readonly string[] {
  const words: string[] = [];

  function walk(value: unknown): void {
    if (typeof value === "string") {
      words.push(value);
      return;
    }
    if (typeof value === "function") {
      walk((value as (...input: string[]) => string)("1:23", "4:56"));
      return;
    }
    if (typeof value === "object" && value !== null) {
      for (const entry of Object.values(value)) walk(entry);
    }
  }

  walk(copy);
  return words;
}

/** Keys the page declares through data-copy, data-copy-aria-label and data-copy-title. */
function readDeclaredKeys(): readonly string[] {
  return Array.from(
    CONDUCTOR_HTML.matchAll(/\bdata-copy(?:-aria-label|-title)?="([^"]+)"/g),
    (match) => match[1] ?? "",
  );
}

describe("CONDUCTOR_COPY", () => {
  for (const language of OPERATOR_LANGUAGES) {
    const copy = CONDUCTOR_COPY[language];

    test(`${language} names itself`, () => {
      expect(copy.language).toBe(language);
    });

    test(`${language} says something everywhere`, () => {
      const words = readWords(copy);
      expect(words.length).toBeGreaterThan(0);
      for (const word of words) {
        expect(word.trim()).not.toBe("");
      }
    });

    test(`${language} names every cue the piece plays`, () => {
      // The fallback keeps an unnamed cue readable, so coverage is asked of
      // the table itself rather than of the words it happens to produce.
      for (const cue of PIECE_SCHEDULE.narration) {
        expect(CHAPTER_NAMES[language]).toHaveProperty(cue.cueId);
      }
    });

    test(`${language} has every copy key the conductor page declares`, () => {
      const keys = readDeclaredKeys();
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) {
        expect(Object.hasOwn(copy.text, key), key).toBe(true);
      }
    });
  }

  test("every static copy entry is declared by the conductor page", () => {
    const declared = new Set(readDeclaredKeys());
    for (const key of Object.keys(CONDUCTOR_COPY.en.text)) {
      expect(declared.has(key), key).toBe(true);
    }
  });

  test("the HTML default is the English copy", () => {
    for (const match of CONDUCTOR_HTML.matchAll(
      /\bdata-copy="([^"]+)"[^>]*>([^<]*)</g,
    )) {
      const [, key = "", text = ""] = match;
      expect(text.trim(), key).toBe(
        CONDUCTOR_COPY.en.text[key as keyof ConductorCopy["text"]],
      );
    }
  });

  test("an unknown cue still reads as its own id", () => {
    expect(CONDUCTOR_COPY.de.timeline.chapter("interlude")).toBe("Interlude");
  });

  test("the two catalogues are not one catalogue twice", () => {
    // The German page must actually be German: proper names and "OK" aside,
    // the prose has to differ from the English it was written against.
    const english = readWords(CONDUCTOR_COPY.en);
    const german = readWords(CONDUCTOR_COPY.de);
    const shared = english.filter((word, index) => german[index] === word);

    expect(shared.length).toBeLessThan(english.length / 3);
  });
});
