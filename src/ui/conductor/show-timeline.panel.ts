import type { NarrationSchedule } from "../../dramaturgy/narration-schedule";
import {
  type TimelineChapter,
  timelineChapters,
} from "../../dramaturgy/schedule-layout";
import type { Run, TutorialObservation } from "../../levels/run-contract";
import { requireElement, writeAttribute, writeText } from "../shared/dom";
import { formatShowTime } from "../shared/show-time-format";
import { attachScrubbing } from "../shared/transport-scrubbing";
import {
  showTrackFraction,
  type TimelineRun,
  TUTORIAL_TRACK_FRACTION,
  trackShowSeconds,
} from "../shared/tutorial-timeline";
import type { ConductorCopy } from "./conductor-copy";
import { CONDUCTOR_SETTINGS } from "./operator-settings";
import type { ConductorPanel } from "./view-state";

export interface ShowTimelineOptions {
  readonly parent: HTMLElement;
  readonly signal: AbortSignal;
  readonly schedule: NarrationSchedule;
  readonly run: Pick<
    Run,
    "show" | "readTutorial" | "skipTutorial" | "resetShowAndFlight"
  >;
  /** Reports the operator's own position, or undefined when the drag ends. */
  readonly onScrubChange: (showTimeSeconds: number | undefined) => void;
}

interface ChapterView {
  chapter: TimelineChapter;
  readonly slot: SVGSVGElement;
  readonly progress: SVGRectElement;
  readonly button: HTMLButtonElement;
}

/** An element whose words follow the operator language. */
interface CopyTarget {
  readonly element: Element;
  readonly read: (copy: ConductorCopy) => string;
}

export function createShowTimeline({
  parent,
  signal,
  schedule,
  run,
  onScrubChange,
}: ShowTimelineOptions): ConductorPanel {
  const readShow = () => run.show;
  const hasTutorial = !!run.readTutorial();
  const seek = (seconds: number) => {
    const available = readShow();
    if (available) available.seekTo(seconds);
    else run.skipTutorial(seconds);
  };
  const durationSeconds = schedule.durationSeconds;
  const root = requireElement(parent, ".conductor__timeline", HTMLElement);
  const readout = requireElement(
    root,
    "[data-timeline-readout]",
    HTMLOutputElement,
  );
  const track = requireElement(root, ".timeline__track", SVGSVGElement);
  const slider = requireElement(
    root,
    ".conductor__timeline-slider",
    HTMLElement,
  );
  const buttons = requireElement(root, ".conductor__chapters", HTMLElement);
  const playhead = requireElement(track, ".timeline__playhead", SVGLineElement);
  const slotTemplate = requireElement(
    root,
    "[data-chapter-slot]",
    HTMLTemplateElement,
  );
  const buttonTemplate = requireElement(
    root,
    "[data-chapter-button]",
    HTMLTemplateElement,
  );
  const copyTargets: CopyTarget[] = [];
  const chapters = timelineChapters(schedule).map((chapter) => {
    const slotFragment = document.importNode(slotTemplate.content, true);
    const slot = requireElement(slotFragment, "svg", SVGSVGElement);
    const progress = requireElement(
      slot,
      ".timeline__progress",
      SVGRectElement,
    );
    slot.setAttribute(
      "x",
      `${showTrackFraction(chapter.startSeconds, durationSeconds, hasTutorial) * 100}%`,
    );
    slot.setAttribute(
      "width",
      `${((chapter.endSeconds - chapter.startSeconds) / durationSeconds) * (hasTutorial ? 1 - TUTORIAL_TRACK_FRACTION : 1) * 100}%`,
    );
    const buttonFragment = document.importNode(buttonTemplate.content, true);
    const button = requireElement(buttonFragment, "button", HTMLButtonElement);
    const readName = (copy: ConductorCopy) =>
      copy.timeline.chapter(chapter.cueId);
    copyTargets.push(
      { element: requireElement(slot, "text", SVGTextElement), read: readName },
      {
        element: requireElement(button, "[data-name]", HTMLElement),
        read: readName,
      },
    );
    requireElement(
      button,
      ".conductor__chapter-time",
      HTMLElement,
    ).textContent = formatShowTime(chapter.startSeconds);
    return { chapter, slot, progress, button } satisfies ChapterView;
  });
  const tutorialSlot = hasTutorial
    ? requireElement(
        document.importNode(slotTemplate.content, true),
        "svg",
        SVGSVGElement,
      )
    : undefined;
  const tutorialButton = hasTutorial
    ? requireElement(
        document.importNode(buttonTemplate.content, true),
        "button",
        HTMLButtonElement,
      )
    : undefined;
  if (tutorialSlot && tutorialButton) {
    tutorialButton.dataset.tutorial = "";
    tutorialSlot.dataset.tutorialBlock = "";
    tutorialSlot.setAttribute("x", "0%");
    tutorialSlot.setAttribute("width", `${TUTORIAL_TRACK_FRACTION * 100}%`);
    const readTutorialName = (copy: ConductorCopy) => copy.timeline.tutorial;
    copyTargets.push(
      {
        element: requireElement(tutorialSlot, "text", SVGTextElement),
        read: readTutorialName,
      },
      {
        element: requireElement(tutorialButton, "[data-name]", HTMLElement),
        read: readTutorialName,
      },
      {
        element: requireElement(
          tutorialButton,
          ".conductor__chapter-time",
          HTMLElement,
        ),
        read: (copy) => copy.timeline.tutorialTime,
      },
    );
    tutorialButton.addEventListener("click", () => run.resetShowAndFlight(), {
      signal,
    });
    track.insertBefore(tutorialSlot, playhead);
    buttons.append(tutorialButton);
  }
  for (const view of chapters) {
    const { slot, button } = view;
    button.addEventListener("click", () => seek(view.chapter.startSeconds), {
      signal,
    });
    track.insertBefore(slot, playhead);
    buttons.append(button);
  }
  signal.addEventListener(
    "abort",
    () => {
      tutorialSlot?.remove();
      tutorialButton?.remove();
      for (const view of chapters) {
        view.slot.remove();
        view.button.remove();
      }
    },
    { once: true },
  );
  attachScrubbing({
    track,
    readDurationSeconds: () => durationSeconds,
    readShow,
    mapFraction: (fraction) =>
      trackShowSeconds(fraction, durationSeconds, hasTutorial),
    onUnavailableSeek: seek,
    onScrubChange,
    signal,
  });
  slider.setAttribute("aria-valuemax", String(durationSeconds));
  slider.addEventListener(
    "keydown",
    (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const show = readShow();
      if (!show) return;
      const step = event.shiftKey
        ? CONDUCTOR_SETTINGS.coarseNudgeSeconds
        : CONDUCTOR_SETTINGS.nudgeSeconds;
      let seconds: number;
      switch (event.key) {
        case "ArrowLeft":
        case "ArrowDown":
          seconds = show.sample().timeSeconds - step;
          break;
        case "ArrowRight":
        case "ArrowUp":
          seconds = show.sample().timeSeconds + step;
          break;
        case "Home":
          seconds = 0;
          break;
        case "End":
          seconds = durationSeconds;
          break;
        default:
          return;
      }
      event.preventDefault();
      show.seekTo(seconds);
    },
    { signal },
  );

  let appliedCopy: ConductorCopy | undefined;
  function applyCopy(copy: ConductorCopy): void {
    if (appliedCopy === copy) return;
    appliedCopy = copy;
    for (const { element, read } of copyTargets) writeText(element, read(copy));
  }

  function updatePosition(
    showTimeSeconds: number,
    tutorial: ReturnType<TimelineRun["readTutorial"]>,
    copy: ConductorCopy,
  ): void {
    const text = readoutText(
      formatShowTime(showTimeSeconds),
      formatShowTime(durationSeconds),
      tutorial,
      copy,
    );
    writeText(readout, text.visible);
    writeAttribute(
      slider,
      "aria-valuenow",
      String(Math.floor(showTimeSeconds)),
    );
    writeAttribute(slider, "aria-valuetext", text.accessible);
    writeAttribute(slider, "aria-disabled", String(!readShow()));
    const position = `${tutorial ? 0 : showTrackFraction(showTimeSeconds, durationSeconds, hasTutorial) * 100}%`;
    writeAttribute(playhead, "x1", position);
    writeAttribute(playhead, "x2", position);
  }

  function updateChapters(showTimeSeconds: number, isTutorial: boolean): void {
    if (tutorialButton)
      writeAttribute(tutorialButton, "aria-pressed", String(isTutorial));
    if (tutorialSlot)
      writeAttribute(tutorialSlot, "data-current", String(isTutorial));
    for (const view of chapters) {
      const { startSeconds, endSeconds } = view.chapter;
      const isCurrent =
        !isTutorial &&
        showTimeSeconds >= startSeconds &&
        (showTimeSeconds < endSeconds || endSeconds === durationSeconds);
      writeAttribute(view.slot, "data-current", String(isCurrent));
      writeAttribute(view.button, "aria-pressed", String(isCurrent));
      const played =
        endSeconds > startSeconds
          ? (showTimeSeconds - startSeconds) / (endSeconds - startSeconds)
          : 1;
      writeAttribute(
        view.progress,
        "width",
        `${isTutorial ? 0 : Math.min(Math.max(played, 0), 1) * 100}%`,
      );
    }
  }

  return {
    update(state): void {
      const tutorial = run.readTutorial();
      applyCopy(state.copy);
      updatePosition(state.showTimeSeconds, tutorial, state.copy);
      updateChapters(state.showTimeSeconds, !!tutorial);
    },
  };
}

/** The position readout and its slider value text, in the operator language. */
function readoutText(
  time: string,
  duration: string,
  tutorial: TutorialObservation | undefined,
  copy: ConductorCopy,
): { readonly visible: string; readonly accessible: string } {
  if (tutorial) {
    const text = tutorialReadout(tutorial, copy);
    return { visible: text, accessible: text };
  }
  return {
    visible: `${time} / ${duration}`,
    accessible: copy.timeline.position(time, duration),
  };
}

/** The shared English readout's shape, in the operator language. */
function tutorialReadout(
  progress: TutorialObservation,
  copy: ConductorCopy,
): string {
  const { timeline } = copy;
  const phase =
    progress.phase === "closing"
      ? ` · ${timeline.closing}`
      : progress.phase === "transition"
        ? ` · ${timeline.transition}`
        : "";
  return `${timeline.tutorial} ${progress.completedChunks}/${progress.totalChunks} · ${timeline.tutorialPlayback[progress.playback]}${phase}`;
}
