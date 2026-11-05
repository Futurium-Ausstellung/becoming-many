/**
 * Every word the conductor page shows, in each language a station is run in.
 * Front-of-house staff read this page, and the venue decides which language that
 * is. The visitor's narration language is a separate choice owned by Run.
 * Panels decide which reading deserves which word; this file only says it.
 */

import type { RunPlayback } from "../../levels/run-contract";
import { cueDisplayName } from "../shared/show-time-format";

/** The languages the page itself is read in; the drawer switches between them. */
export const OPERATOR_LANGUAGES = ["en", "de"] as const;

export type OperatorLanguage = (typeof OPERATOR_LANGUAGES)[number];

/**
 * Text declared in `src/ui/conductor.html` through `data-copy`,
 * `data-copy-aria-label` and `data-copy-title`. The HTML keeps the English
 * words as its pre-mount default.
 */
export type StaticCopyKey =
  | "status.label"
  | "status.sound"
  | "status.controller"
  | "status.headset"
  | "masthead.technicianTools"
  | "transport.label"
  | "transport.stop"
  | "transport.stopTitle"
  | "narration.label"
  | "preview.label"
  | "timeline.label"
  | "timeline.readout"
  | "timeline.position"
  | "drawer.title"
  | "drawer.close"
  | "drawer.caution"
  | "drawer.rehearsalSpeed"
  | "drawer.resets"
  | "drawer.resetShow"
  | "drawer.resetFlight"
  | "drawer.m5"
  | "drawer.controllerState"
  | "drawer.bundledFirmware"
  | "drawer.flash"
  | "drawer.operatorLanguage"
  | "m5.host"
  | "m5.set"
  | "m5.clear"
  | "readout.m5"
  | "readout.level"
  | "readout.audio"
  | "readout.narration"
  | "wake.headline"
  | "wake.hint"
  | "wake.pill";

/** What a status tile can say, before a language turns it into a word. */
export type StatusValue =
  | "ok"
  | "asleep"
  | "connecting"
  | "checking"
  | "ready"
  | "streaming"
  | "unavailable"
  | "none";

/** What the headset picture button can say. */
export type PictureLabel =
  | "on"
  | "off"
  | "unavailable"
  | "connecting"
  | "stopping"
  | "retry";

/** What the main transport button offers. */
export type TransportLabel = "play" | "pause" | "retry";

export interface ConductorCopy {
  /** The catalogue names itself, so a panel needs no second field to compare. */
  readonly language: OperatorLanguage;
  readonly text: Readonly<Record<StaticCopyKey, string>>;
  readonly status: Readonly<Record<StatusValue, string>>;
  readonly picture: {
    readonly labels: Readonly<Record<PictureLabel, string>>;
    readonly start: string;
    readonly stop: string;
  };
  readonly transport: Readonly<Record<TransportLabel, string>>;
  readonly timeline: {
    /** A cue id as a chapter name; an unnamed id still reads as itself. */
    readonly chapter: (cueId: string) => string;
    readonly position: (time: string, duration: string) => string;
    readonly tutorial: string;
    readonly tutorialTime: string;
    readonly tutorialPlayback: Readonly<Record<RunPlayback, string>>;
    readonly closing: string;
    readonly transition: string;
  };
  readonly reloadReminder: {
    /** Above the countdown while a reload is not yet recommended. */
    readonly pending: string;
    readonly pendingTitle: string;
    /** Above the action once a reload is recommended. */
    readonly due: string;
    readonly dueTitle: string;
    readonly action: string;
  };
  readonly drawer: {
    readonly reload: string;
    readonly reloadArmed: string;
    readonly noControllerResponse: string;
  };
  readonly m5: {
    readonly lockedTitle: string;
    readonly noSignal: string;
  };
}

/**
 * Chapter names per language, keyed by the schedule's cue ids. A cue without a
 * name here still reads as its own id; the tests hold this table against the
 * piece schedule so the piece's own cues stay named in both languages.
 */
export const CHAPTER_NAMES: Readonly<
  Record<OperatorLanguage, Readonly<Record<string, string>>>
> = {
  en: {
    prologue: "Prologue",
    scent: "Scent",
    echo: "Echo",
    motion: "Motion",
    thermal: "Thermal",
    magnetic: "Magnetic",
    finale: "Finale",
    return: "Return",
  },
  de: {
    prologue: "Prolog",
    scent: "Geruch",
    echo: "Echo",
    motion: "Bewegung",
    thermal: "Wärme",
    magnetic: "Magnetfeld",
    finale: "Finale",
    return: "Rückkehr",
  },
};

function chapterNamer(language: OperatorLanguage): (cueId: string) => string {
  const names = CHAPTER_NAMES[language];
  return (cueId) => names[cueId] ?? cueDisplayName(cueId);
}

const ENGLISH: ConductorCopy = {
  language: "en",
  text: {
    "status.label": "Station status",
    "status.sound": "Sound",
    "status.controller": "Controller",
    "status.headset": "Headset",
    "masthead.technicianTools": "Technician tools",
    "transport.label": "Transport",
    "transport.stop": "Stop",
    "transport.stopTitle": "Reset time and flight position",
    "narration.label": "Narration language",
    "preview.label": "Experience preview",
    "timeline.label": "Show timeline",
    "timeline.readout": "Elapsed and total show time",
    "timeline.position": "Show position",
    "drawer.title": "Technician tools",
    "drawer.close": "Close technician tools",
    "drawer.caution": "Changes here can interrupt the show.",
    "drawer.rehearsalSpeed": "Rehearsal speed",
    "drawer.resets": "Resets",
    "drawer.resetShow": "Reset show time",
    "drawer.resetFlight": "Reset flight position",
    "drawer.m5": "M5 controller",
    "drawer.controllerState": "Controller state",
    "drawer.bundledFirmware": "Bundled firmware:",
    "drawer.flash": "Flash and set up a controller",
    "drawer.operatorLanguage": "Page language",
    "m5.host": "M5 host",
    "m5.set": "Set",
    "m5.clear": "Clear",
    "readout.m5": "M5",
    "readout.level": "Level",
    "readout.audio": "Audio",
    "readout.narration": "Narration",
    "wake.headline": "The station is asleep",
    "wake.hint": "Tap anywhere on this screen.",
    "wake.pill": "Tap to wake",
  },
  status: {
    ok: "OK",
    asleep: "Asleep",
    connecting: "Connecting",
    checking: "Checking",
    ready: "Ready",
    streaming: "Streaming",
    unavailable: "VR unavailable",
    none: "—",
  },
  picture: {
    labels: {
      on: "Picture On",
      off: "Picture Off",
      unavailable: "Picture unavailable",
      connecting: "Picture: connecting",
      stopping: "Picture: stopping",
      retry: "Picture: click to retry",
    },
    start: "Start headset picture",
    stop: "Stop headset picture",
  },
  transport: {
    play: "Play",
    pause: "Pause",
    retry: "Retry",
  },
  timeline: {
    chapter: chapterNamer("en"),
    position: (time, duration) => `${time} of ${duration}`,
    tutorial: "Tutorial",
    tutorialTime: "Chunks",
    tutorialPlayback: {
      playing: "Running",
      paused: "Paused · Press Play",
      loading: "Loading",
      buffering: "Waiting for audio",
      blocked: "Waiting for audio · Press Play",
      error: "Error · Press Stop to retry",
      ended: "Ended",
    },
    closing: "Closing",
    transition: "Transition",
  },
  reloadReminder: {
    pending: "Reload in",
    pendingTitle: "A page reload will be recommended when this reaches zero",
    due: "Reload recommended",
    dueTitle: "Reload the page now to restore performance",
    action: "Tap to reload",
  },
  drawer: {
    reload: "Reload page",
    reloadArmed: "Tap again to reload",
    noControllerResponse: "No controller response yet.",
  },
  m5: {
    lockedTitle: "Set by the station's deployment config",
    noSignal: "no signal",
  },
};

/** The script addresses its visitor with "du"; the station reads the same way. */
const GERMAN: ConductorCopy = {
  language: "de",
  text: {
    "status.label": "Stationsstatus",
    "status.sound": "Ton",
    "status.controller": "Controller",
    "status.headset": "Headset",
    "masthead.technicianTools": "Technik",
    "transport.label": "Transport",
    "transport.stop": "Stopp",
    "transport.stopTitle": "Zeit und Flugposition zurücksetzen",
    "narration.label": "Sprache der Erzählung",
    "preview.label": "Vorschau des Erlebnisses",
    "timeline.label": "Ablauf",
    "timeline.readout": "Verstrichene und gesamte Spielzeit",
    "timeline.position": "Position im Ablauf",
    "drawer.title": "Technik",
    "drawer.close": "Technik schließen",
    "drawer.caution":
      "Änderungen hier können die laufende Vorstellung unterbrechen.",
    "drawer.rehearsalSpeed": "Probentempo",
    "drawer.resets": "Zurücksetzen",
    "drawer.resetShow": "Spielzeit zurücksetzen",
    "drawer.resetFlight": "Flugposition zurücksetzen",
    "drawer.m5": "M5-Controller",
    "drawer.controllerState": "Zustand des Controllers",
    "drawer.bundledFirmware": "Mitgelieferte Firmware:",
    "drawer.flash": "Controller flashen und einrichten",
    "drawer.operatorLanguage": "Sprache der Oberfläche",
    "m5.host": "M5-Adresse",
    "m5.set": "Setzen",
    "m5.clear": "Leeren",
    "readout.m5": "M5",
    "readout.level": "Ebene",
    "readout.audio": "Audio",
    "readout.narration": "Erzählung",
    "wake.headline": "Die Station schläft",
    "wake.hint": "Tippe irgendwo auf diesen Bildschirm.",
    "wake.pill": "Zum Wecken tippen",
  },
  status: {
    ok: "OK",
    asleep: "Schläft",
    connecting: "Verbindet",
    checking: "Prüft",
    ready: "Bereit",
    streaming: "Überträgt",
    unavailable: "VR nicht verfügbar",
    none: "—",
  },
  picture: {
    labels: {
      on: "Bild an",
      off: "Bild aus",
      unavailable: "Bild nicht verfügbar",
      connecting: "Bild: verbindet",
      stopping: "Bild: wird beendet",
      retry: "Bild: zum Wiederholen tippen",
    },
    start: "Headset-Bild starten",
    stop: "Headset-Bild beenden",
  },
  transport: {
    play: "Abspielen",
    pause: "Pause",
    retry: "Erneut versuchen",
  },
  timeline: {
    chapter: chapterNamer("de"),
    position: (time, duration) => `${time} von ${duration}`,
    tutorial: "Tutorial",
    tutorialTime: "Abschnitte",
    tutorialPlayback: {
      playing: "Läuft",
      paused: "Pausiert · Abspielen drücken",
      loading: "Lädt",
      buffering: "Wartet auf Audio",
      blocked: "Wartet auf Audio · Abspielen drücken",
      error: "Fehler · Zum Wiederholen Stopp drücken",
      ended: "Beendet",
    },
    closing: "Abschluss",
    transition: "Übergang",
  },
  reloadReminder: {
    pending: "Neu laden in",
    pendingTitle: "Bei null wird empfohlen, die Seite neu zu laden",
    due: "Neu laden empfohlen",
    dueTitle: "Seite jetzt neu laden, um die Leistung wiederherzustellen",
    action: "Tippen: neu laden",
  },
  drawer: {
    reload: "Seite neu laden",
    reloadArmed: "Nochmal tippen: neu laden",
    noControllerResponse: "Noch keine Antwort vom Controller.",
  },
  m5: {
    lockedTitle: "Von der Deployment-Konfiguration der Station gesetzt",
    noSignal: "kein Signal",
  },
};

export const CONDUCTOR_COPY: Readonly<Record<OperatorLanguage, ConductorCopy>> =
  {
    en: ENGLISH,
    de: GERMAN,
  };
