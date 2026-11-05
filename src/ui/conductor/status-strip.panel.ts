import type { M5Observation } from "../../m5/m5-contract";
import type { XrSessionState } from "../../world/xr-contract";
import { requireElement, writeText } from "../shared/dom";
import type { StatusValue } from "./conductor-copy";
import type { ConductorPanel } from "./view-state";

type ReadingState = "idle" | "live" | "warn";

interface Tile {
  readonly write: (
    words: Readonly<Record<StatusValue, string>>,
    value: StatusValue,
    state: ReadingState,
  ) => void;
}

export interface StatusStripOptions {
  /** The masthead row the tiles sit in, beside the station identity. */
  readonly tilesParent: HTMLElement;
}

export function createStatusStrip({
  tilesParent,
}: StatusStripOptions): ConductorPanel {
  const root = requireElement(tilesParent, ".conductor__tiles", HTMLElement);
  const sound = bindTile(root, "sound");
  const controller = bindTile(root, "controller");
  const headset = bindTile(root, "headset");

  return {
    update(state): void {
      const words = state.copy.status;
      sound.write(words, ...soundReading(state.audioState));
      controller.write(words, ...controllerReading(state.m5));
      headset.write(words, ...headsetReading(state.xr));
    },
  };
}

type ReadingText = readonly [value: StatusValue, state: ReadingState];

/** Anything but "running" freezes show time; the wake overlay says how. */
function soundReading(audioState: AudioContextState): ReadingText {
  return audioState === "running" ? ["ok", "live"] : ["asleep", "warn"];
}

function headsetReading(xr: XrSessionState): ReadingText {
  if (xr.isSessionActive) return ["streaming", "live"];

  if (xr.availability === "unknown") return ["checking", "idle"];
  return xr.availability === "available"
    ? ["ready", "idle"]
    : ["unavailable", "warn"];
}

/**
 * An absent adapter or `off` status means no host is set —
 * both read as "no device", which is a normal state, not a fault. A
 * live reply supplies steering; metadata stays in the technician drawer.
 */
function controllerReading(status: M5Observation | undefined): ReadingText {
  if (status === undefined || status.status === "off") return ["none", "idle"];
  if (status.status === "connecting") return ["connecting", "warn"];

  return ["ok", "live"];
}

function bindTile(root: HTMLElement, name: string): Tile {
  const tile = requireElement(root, `[data-tile="${name}"]`, HTMLElement);
  const output = requireElement(tile, "output", HTMLOutputElement);
  return {
    write(words, value, state): void {
      writeText(output, words[value]);
      if (tile.dataset.state !== state) tile.dataset.state = state;
    },
  };
}
