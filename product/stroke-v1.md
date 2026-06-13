# Stroke V1

iPad-first web app for learning Chinese characters by tracing with Apple Pencil. Stroke is a lazy-loaded mini-app in the `exio4.github.io` dashboard at `/apps/stroke/*`.

This version supersedes `product/stroke-v0.md`. The key V1 change is to build on HanziWriter instead of hand-rolling stroke recognition, stroke-order grading, and pixel-overlap scoring.

---

## V1 Thesis

Stroke should feel like a focused Chinese writing trainer, not a drawing app.

The V0 plan centered on a custom Canvas 2D drawing layer, timeout-based stroke lock-in, and bespoke pixel-overlap scoring. After reviewing the HanziWriter documentation, V1 should use HanziWriter's quiz engine as the core interaction layer:

- HanziWriter already renders Chinese character stroke data.
- It supports stroke-order quizzes with callbacks for correct strokes, mistakes, and completion.
- It can load character data locally through `charDataLoader`, avoiding the default CDN path.
- It supports custom SVG backgrounds, which fits the 田字格 grid.
- It exposes raw loaded stroke data and scaling transforms for future visualizations.

This lets V1 spend complexity budget on curriculum, SRS, iPad ergonomics, progress, and a polished practice loop.

---

## Product Scope

### Target User

- Primary: iPad Safari user practicing with Apple Pencil.
- Secondary: mouse or finger input for development, testing, and demos.
- UX copy should recommend Pencil when available, but never block other input.

### V1 Content

One course: **Essentials**

Decks:

- **Numbers**: 一, 二, 三, 四, 五, 六, 七, 八, 九, 十
- **Common**: 人, 口, 日, 月, 水, 火, 山, 木, 大, 小

Each character has:

- Hanzi character.
- Pinyin with tone marks.
- English meaning.
- Radical or component note.
- Example word or sentence.
- Deck/course membership.
- HanziWriter character data import.

### V1 Screens

1. **Dashboard**
   - Today's due reviews.
   - Continue Review button when there are due characters.
   - Daily goal progress.
   - Streak summary.
   - Deck grid with completion and best-star progress.

2. **Deck**
   - Character list for a deck.
   - Per-character best stars, due state, and last attempt.
   - Start deck practice.

3. **Practice**
   - Responsive square 田字格 writing area.
   - HanziWriter quiz surface.
   - Character metadata panel: pinyin, meaning, radical/component, example.
   - Controls: play pronunciation, animate stroke order, retry, next.
   - Pencil-first messaging based on latest pointer type when detectable.

4. **Result**
   - 1/2/3-star result.
   - Total mistakes.
   - Per-stroke result log.
   - Retry or continue.

---

## HanziWriter Approach

### Dependencies

Installed packages:

- `hanzi-writer`
- `hanzi-writer-data`

The data package is installed as the full corpus in `node_modules`, but the app should only import the V1 characters it needs. Do not import `hanzi-writer-data` from its package root; it intentionally throws. Do not bundle an all-character JSON file for V1.

Recommended pattern:

```ts
import HanziWriter from 'hanzi-writer'
import yi from 'hanzi-writer-data/一.json'

const characterData = {
  一: yi,
}

const writer = HanziWriter.create(targetElement, '一', {
  width: size,
  height: size,
  padding: 24,
  showCharacter: false,
  showOutline: true,
  showHintAfterMisses: false,
  highlightOnComplete: false,
  charDataLoader: (char: string) => characterData[char],
})
```

Implementation note: TypeScript will likely need a local declaration for `hanzi-writer-data/*.json`, and the character-data type should model the HanziWriter shape:

```ts
interface HanziWriterCharacterData {
  strokes: string[]
  medians: number[][][]
  radStrokes?: number[]
}
```

### Rendering

Use HanziWriter's default SVG renderer for V1.

Reasons:

- The docs show custom SVG backgrounds, which is the cleanest path for a 田字格 grid.
- SVG keeps guide strokes, outlines, and custom overlays inspectable.
- HanziWriter also has a `renderer: 'canvas'` option if SVG is too slow on iPad, but that should be a measured fallback.

The writing area should be a dedicated component that:

- Owns the HanziWriter instance lifecycle.
- Uses `ResizeObserver` to keep the square canvas/SVG responsive.
- Calls `writer.updateDimensions()` on resize.
- Recreates or updates the writer when the current character changes.
- Cancels active quizzes during cleanup.

### Practice Modes

V1 should have two lightweight modes:

- **Learn**: show outline and allow stroke-order animation.
- **Quiz**: hide the filled character, keep outline visible, and grade the user's strokes.

Use `writer.animateCharacter()` for the learn/replay affordance.

Use `writer.quiz()` for active practice:

```ts
writer.quiz({
  leniency,
  showHintAfterMisses: false,
  highlightOnComplete: false,
  onMistake: handleMistake,
  onCorrectStroke: handleCorrectStroke,
  onComplete: handleComplete,
})
```

### Scoring

Do not build custom pixel-overlap scoring in V1.

Use HanziWriter's quiz grading and callbacks as the source of truth. Convert mistakes and completion quality into stars:

| Result | Star Rating | SRS Meaning |
|---|---:|---|
| Completed with 0 mistakes | 3 | Strong pass; increase interval |
| Completed with low mistakes | 2 | Pass; modest interval |
| Completed with repeated mistakes | 1 | Weak pass; short interval |
| Abandoned or not completed | 0 | No progress update, or due now |

Initial thresholds:

- 3 stars: `totalMistakes === 0`
- 2 stars: `totalMistakes <= ceil(strokeCount * 0.25)`
- 1 star: completed with more mistakes

Store the HanziWriter callback payloads for attempt history. Both `onMistake` and `onCorrectStroke` include stroke number, mistakes on that stroke, total mistakes, remaining strokes, and drawn path data.

### Hints

Default V1 should keep hints manual or disabled:

- `showHintAfterMisses: false` for serious practice.
- A visible Hint action can call `writer.highlightStroke(strokeNum)` for the current stroke if needed.

This keeps the no-hand-holding feel from V0 without forcing us to build a custom stroke-order overlay.

### Pencil Input

HanziWriter owns the actual drawing interaction. V1 should not try to use pressure or tilt for brush dynamics unless we later add a custom drawing layer.

Pencil-first polish still matters:

- Writing area uses `touch-action: none`.
- Page avoids scroll conflict while writing.
- Buttons are reachable outside the writing square.
- Track the latest `pointerdown` on the writing container in capture phase to classify attempts as `pen`, `touch`, `mouse`, or `unknown`.
- Copy recommends Apple Pencil when the user is drawing with finger/mouse, but does not interrupt the session.

---

## Data And Storage

### Static Content

Static course/deck/character metadata lives in app code:

- `src/apps/stroke/content.ts`
- `src/apps/stroke/hanziData.ts`

`hanziData.ts` imports only selected V1 character JSON modules from `hanzi-writer-data`.

### IndexedDB

Use IndexedDB in V1 for all durable user state.

Database: `stroke-v1`

Object stores:

| Store | Key | Purpose |
|---|---|---|
| `progress` | `character` | Best stars, SRS state, last attempt summary |
| `attempts` | auto increment | Detailed attempt history and drawn path payloads |
| `settings` | `key` | Daily goal, leniency, practice preferences |
| `streaks` | `key` | Daily completion/streak bookkeeping |

No backend, no account, no sync.

### Progress Record

```ts
interface CharacterProgress {
  character: string
  bestStars: 0 | 1 | 2 | 3
  attempts: number
  lastPracticedAt?: string
  dueAt: string
  intervalDays: number
  ease: number
  lapses: number
}
```

### Attempt Record

```ts
interface StrokeAttempt {
  id?: number
  character: string
  deckId: string
  startedAt: string
  completedAt?: string
  completed: boolean
  stars: 0 | 1 | 2 | 3
  totalMistakes: number
  strokeCount: number
  inputType: 'pen' | 'touch' | 'mouse' | 'unknown'
  leniency: number
  canvasSize: number
  strokeEvents: StrokeAttemptEvent[]
}
```

---

## SRS Model

Use a small SM-2-inspired scheduler, not a complex engine.

V1 scheduling:

| Stars | Next Due |
|---:|---|
| 3 | increase interval strongly |
| 2 | increase interval modestly |
| 1 | due soon |
| 0 | due now |

Initial intervals:

- New character: due now.
- 1 star: 10 minutes or next session.
- 2 stars: 1 day.
- 3 stars: 3 days, then scale upward.

Suggested update:

```ts
if (stars === 3) {
  intervalDays = intervalDays === 0 ? 3 : Math.ceil(intervalDays * ease)
  ease = Math.min(2.8, ease + 0.08)
}

if (stars === 2) {
  intervalDays = intervalDays === 0 ? 1 : Math.ceil(intervalDays * 1.4)
}

if (stars === 1) {
  intervalDays = 0
  ease = Math.max(1.3, ease - 0.15)
  lapses += 1
}
```

The dashboard review queue is every character whose `dueAt <= now`.

---

## Offline Posture

V1 should be offline-capable in its data model, but not force a full PWA/service-worker implementation unless it stays simple.

Required for V1:

- No runtime dependency on HanziWriter CDN character loading.
- Bundle selected character data locally through `hanzi-writer-data`.
- Store progress and attempts in IndexedDB.

Not required for V1:

- Service worker.
- Installable PWA shell.
- Cross-device sync.

Practical outcome: after the app bundle is available, practice data does not need network access. True offline launch/reload reliability can be a V1.1 task with a service worker.

---

## App Architecture

Suggested files:

```txt
src/apps/stroke/
  index.tsx
  stroke.css
  content.ts
  hanziData.ts
  db.ts
  srs.ts
  scoring.ts
  practiceState.ts
  components/
    StrokeDashboard.tsx
    DeckView.tsx
    PracticeView.tsx
    HanziWriterSurface.tsx
    CharacterInfo.tsx
    ResultPanel.tsx
```

Route shape inside `/apps/stroke/*`:

- `/apps/stroke` - dashboard.
- `/apps/stroke/decks/:deckId` - deck detail.
- `/apps/stroke/practice/:deckId/:character` - single-character practice.
- `/apps/stroke/review` - SRS review queue.

The architecture does not need ToneForge's deeper simulation engine. Keep pure modules for:

- content lookup,
- scoring,
- SRS scheduling,
- IndexedDB serialization.

Let the HanziWriter wrapper own the imperative rendering/quiz lifecycle.

---

## Implementation Plan

### Milestone 1 - Product Skeleton

- Add `src/apps/stroke/`.
- Lazy-load Stroke in `src/App.tsx`.
- Add Stroke card to the Chinese Learning dashboard group.
- Create app-local routes for dashboard, deck, practice, and review.

### Milestone 2 - HanziWriter Wrapper

- Build `HanziWriterSurface`.
- Render 田字格 SVG background.
- Load selected local character data through `charDataLoader`.
- Support resize and character changes.
- Support animate, quiz, retry, and cleanup.

### Milestone 3 - Content And Practice Flow

- Add Essentials course metadata.
- Build deck list and practice sequence.
- Add character info panel.
- Add Web Speech API pronunciation button.

### Milestone 4 - Scoring And IndexedDB

- Convert HanziWriter quiz callbacks into attempt records.
- Implement star scoring.
- Implement IndexedDB stores.
- Implement SRS due queue and dashboard progress.

### Milestone 5 - iPad Polish

- Test in iPad Safari with Apple Pencil.
- Confirm writing area does not scroll the page.
- Tune HanziWriter `leniency`, padding, colors, and sizing.
- Verify portrait and landscape layouts.

### Milestone 6 - Build Verification

- Run lint and production build.
- Smoke-test local dev route.
- Confirm no CDN requests are required for selected character data.

---

## Deliberate V1 Non-Goals

- Custom Canvas 2D stroke recognition.
- Pressure/tilt-responsive brush rendering.
- Pixel diff overlay.
- Timeout-based stroke lock-in.
- Importing or bundling all HanziWriter data into the shipped app bundle.
- User-created decks.
- Export/import.
- Service worker unless it is trivial after the core app is stable.

---

## Open Checks Before Shipping

- Confirm HanziWriter quiz input behavior on real iPad Safari + Apple Pencil.
- Confirm bundled JSON import syntax with Vite/TypeScript and add module declarations as needed.
- Review Arphic Public License obligations for redistributed character data and include attribution/license text in the app or repository if needed.
- Decide whether hints are fully disabled or available via an explicit Hint button.
