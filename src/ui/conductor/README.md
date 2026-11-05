# Conductor

## Responsibility

The operator UI at `/conductor.html` controls the local station.
The show and embedded experience preview run in this same browser page.
The target folder owns DOM, input bindings, gesture preview, confirmations,
status presentation and UI cleanup. It owns no Show clock or visitor policy.

## Operator layout

- Top: Sound, Controller and Headset status, the Picture button, the reload
  reminder, and technician tools. The Picture button, reload reminder and wrench
  are at least 100px tall for a thumb on the station's touch monitor.
- Main: large Play/Pause and Stop controls, EN/DE below, and the live preview
  alongside them on desktop. Narrow layouts stack controls and preview.
- Bottom: one continuous timeline with chapter progress and chapter jump buttons.
  There is no separate elapsed-time display.

Status combines an icon, readable text and color. Headset status explicitly shows
Checking, VR unavailable, Ready or Streaming. Icons stay visible regardless
of device connection. The M5Stick
uses Lucide's rectangular `smartphone` glyph with a small button. Icons are
individual SVG assets from the installed package, bound to declared SVG elements.

The existing dark palette and square surfaces are retained. Operator buttons
have at least 56px touch targets; narration EN/DE and chapter buttons are 84px
tall. Long German labels wrap inside their buttons. Brighter borders, distinct
selected states and readable disabled labels provide contrast without a separate
styling system. Conductor and Flash are set in Rubik from
`public/fonts/rubik/`, declared in `app.css` as the family `Rubik Operator` so it
never competes with the end-credits canvas's own `Rubik` face; readouts use
tabular digits.

The wake screen names the piece small above the station name in large
uppercase, then a hairline, headline, short hint and a pulsing "Tap to wake"
pill (static under reduced motion). Without a station name the piece takes the
large style.

## Reload reminder

Long-running pages slowly lose performance. The masthead counts down
`reloadReminderMilliseconds` (one hour) from page start. While it counts, the
button is disabled and muted. Once it reaches zero it turns amber, reads
"Reload recommended · Tap to reload", and one tap reloads the whole page through
Entry's `reloadPage`. It never reloads on its own: the operator picks a moment
between visitors. The reload starts a fresh document, so the countdown restarts.

## Operator language

The page is read in English or German, independent of the narration language.
`conductor-copy.ts` holds both catalogues and the chapter names keyed by cue id
(unknown ids fall back to `cueDisplayName`). Static words in `conductor.html`
keep English as the pre-mount default and declare `data-copy`,
`data-copy-aria-label` or `data-copy-title` keys; `static-copy.panel.ts`
rewrites them when the copy changes. Panels map decision values (status, picture,
transport, tutorial playback) through the current copy carried in
`ConductorViewState`. Raw diagnostic readout values stay untranslated.

Entry resolves the initial language with `resolveOperatorLanguage`: the stored
choice (`bm-conductor-language`), else the browser language, else English. Only
an explicit choice in the drawer's Page language group
(`[data-operator-language]`) is stored. The page sets `<html lang>`. Narration
EN/DE (`[data-language]`, `L`) and the drawer's Narration readout remain Run's
language.

## Entry and Engine boundary

`src/entry/conductor.entry.ts` resolves deployment/URL/stored choices, starts one Run,
applies its initial M5 host, mounts the page and connects page exit to cleanup.
`conductor.page.ts` mounts panels against narrow Show/Run/M5/XR capabilities.
Show owns main playback/language; Run owns experience transport and the current
`resetShowAndFlight` operation (rewind, return flight to its opening pose, hold until Play). That operation does
not replace the Run. Browser reload and stored preferences belong to Entry.

## Public interface and retained interaction

Panels draw a local view state and invoke only their needed public commands.
`ConductorViewState` combines Run, Show, XR and M5 observations for drawing.
Language commands and observations use Run directly; panels use one dynamic
source for main Show capabilities without saved fallback handles.
Drag preview, seek throttling, `wasPlaying`, keyboard mapping and
confirmation timers are legitimate UI behavior. Schedule arithmetic remains
in `dramaturgy`; device validity remains in M5.

The Conductor initially waits for Play at the opening of the main Show; its entry
requests no tutorial, so the timeline shows no Tutorial chapter. Play/Pause
controls the main Show through Run. The picture is white until Play, then fades
in. Stop cuts to white, rewinds the main Show, returns flight to its opening pose
and holds until Play. The readout distinguishes running, paused,
loading, buffering, blocked audio and retryable errors. The selected main Show
language is retained. The timeline is the only time display. Language is available
before Play and throughout the main Show. Changes replace speech in place,
preserving playback, course progress and show position. The selected button
reports the requested language; old speech may remain audible while a new file
loads or if replacement fails. `L` toggles language under the same shortcut
rules as transport. Language selection sits below transport; the canvas stays in the main
surface when technician tools open or close. The timeline exposes its position
as a keyboard-accessible slider: arrow keys seek by five seconds (thirty with
Shift), Home and End jump to the bounds. Its geometry follows Show time directly.

Technician tools use a native modal dialog: focus stays inside, Escape closes it
and focus returns to the opener. Global show shortcuts are inactive while it is
open. Its M5 group links to `/flash.html` in a new tab, because leaving this
window would tear down the show it hosts. The language panel owns only language controls; the drawer owns speed, resets and diagnostic readouts.

The wake overlay displays suspended audio; Audio owns its user-activation
listeners. Picture intent starts enabled. The main Picture button displays actual session state
and allows explicit start/stop. The headset panel uses the existing bounded observation
tick to request available XR and recover unexpected session ends. Transient failures
retry every two seconds; browser permission failures wait for an operator click or
playback shortcut and display "Picture: click to retry". Explicit picture-off suppresses
automatic starts until the Picture button enables them again. UI cleanup stops retries.
WebXR cannot guarantee activation without a user gesture or detect every native
streaming fault while a session remains active. PICO/SteamVR transport recovery must
be verified on Windows. Battery telemetry is tracked separately in #131. During XR World copies the rendered left eye to the desktop canvas within the
same frame, capped at 1280 × 720; no second scene render is added.
M5 preview observes accepted samples without consuming flight button edges.
The expandable Controller state section shows the last parsed `/state` reply
and bundled firmware inside the drawer. It reuses the existing poll; metadata
differences never prevent steering from the configured host.

## Resources and styling

UI releases its listeners, subscriptions, timers and cloned chapter nodes. Static
markup belongs to `src/ui/conductor.html` and survives UI cleanup. The entry connects
page exit/cancellation to Run's awaited cleanup; UI never unloads its children.
All authored styling lives in `src/ui/app.css` under the
[Development guide](../../../docs/development.md#ui-and-documentation).
The [binding architecture](../../../docs/architecture.md#integration-star)
owns dependencies and placement; GitHub issues own order.
The full visitor restart and XR/calibration operation remain #9/#46.

## Verification

`bun run test:language` exercises Conductor and Audience language selection with
real native media, delayed/failed replacement, rapid input and lifetime checks.
The `course` case earns all four lessons and switches during successor speech
and closing. Commands and evidence limits are in the
[browser verification guide](../../../tests/browser/README.md#live-language-regression).

`bun tests/browser/headset-picture.mjs` exercises the real Conductor against a
simulated XR contract: user activation, unexpected end, explicit off, transient
retry spacing, reconnect and UI cleanup. Run Vite on port 4180 first, or pass
the base URL as the first argument.

## Verification record

Historical visual and language evidence remains in Git and the owning issues.
Local checks do not establish physical PICO/M5 or Windows-PCVR acceptance.
