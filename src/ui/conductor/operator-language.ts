import { OPERATOR_LANGUAGES, type OperatorLanguage } from "./conductor-copy";

const DEFAULT_OPERATOR_LANGUAGE: OperatorLanguage = "en";

/**
 * The language the conductor page is read in. A stored choice wins; without
 * one the browser's own language decides, so a German station reads German
 * before anybody opens the drawer. Anything unrecognised falls back to English.
 */
export function resolveOperatorLanguage(
  stored: string | null | undefined,
  offered: string | undefined,
): OperatorLanguage {
  return (
    matchOperatorLanguage(stored) ??
    matchOperatorLanguage(offered) ??
    DEFAULT_OPERATOR_LANGUAGE
  );
}

/** A tag like "de-AT" is German; anything the page has no words for is not. */
function matchOperatorLanguage(
  tag: string | null | undefined,
): OperatorLanguage | undefined {
  if (!tag) return undefined;
  const primary = tag.trim().toLowerCase().split("-")[0];
  return OPERATOR_LANGUAGES.find((language) => language === primary);
}
