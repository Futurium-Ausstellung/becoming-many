import { writeAttribute, writeText } from "../shared/dom";
import {
  CONDUCTOR_COPY,
  type ConductorCopy,
  type StaticCopyKey,
} from "./conductor-copy";
import type { ConductorPanel } from "./view-state";

/** Declarative copy attributes and the element property each one writes. */
const COPY_TARGETS = [
  ["data-copy", undefined],
  ["data-copy-aria-label", "aria-label"],
  ["data-copy-title", "title"],
] as const;

/**
 * Rewrite the page's declared words whenever the operator language changes.
 * The HTML keeps English as its pre-mount default; cleanup leaves the last
 * written words in place, like any other observation.
 */
export function createStaticCopy(root: HTMLElement): ConductorPanel {
  const bindings = COPY_TARGETS.flatMap(([attribute, target]) =>
    Array.from(root.querySelectorAll(`[${attribute}]`), (element) => ({
      element,
      target,
      key: readKey(element, attribute),
    })),
  );
  let applied: ConductorCopy | undefined;

  return {
    update({ copy }): void {
      if (applied === copy) return;
      applied = copy;
      for (const { element, target, key } of bindings) {
        if (target) writeAttribute(element, target, copy.text[key]);
        else writeText(element, copy.text[key]);
      }
    },
  };
}

function readKey(element: Element, attribute: string): StaticCopyKey {
  const key = element.getAttribute(attribute) ?? "";
  if (!Object.hasOwn(CONDUCTOR_COPY.en.text, key)) {
    throw new Error(`Unknown conductor copy key: ${key}`);
  }
  return key as StaticCopyKey;
}
