# Stroke

iPad web app for learning Chinese characters by tracing with Apple Pencil. Part of the `exio4.github.io` micro-frontend dashboard, lazy-loaded as a sub-app at `/apps/stroke`.

---

## Core loop

1. **Dashboard**: SRS-driven — shows characters due for review today, plus deck progress overview.
2. **Pick a deck**: User selects a course + deck, or jumps straight into the SRS review queue.
3. **Draw**: A character appears on a 田字格 (tiánzìgé) grid canvas. Numbered guide strokes show the correct stroke order. The user traces each stroke with the Pencil.
4. **Strokes lock in**: After ~1.5s of inactivity (configurable), the current stroke locks. Drawing a new stroke before the timeout continues the sequence.
5. **Score**: Stars based on pixel overlap accuracy. Full diff overlay shows user ink vs. guide, per-stroke color-coded (green/yellow/red).
6. **Retry or continue**: Full-character retry available. No undo, no eraser — raw ink only.

---

## Mechanics

### Drawing & input

| Aspect | Decision |
|---|---|
| Rendering | Canvas 2D API |
| Input | `PointerEvent` with `pointerType: "pen"` for Pencil; finger also accepted |
| Pencil features | Pressure (`pressure`) and tilt (`tiltX`, `tiltY`) for variable line width |
| Palm rejection | iPadOS built-in; first-pointer lock as fallback |
| Stroke lock-in | Timeout-based (~1.5s between strokes) — pause too long and the stroke scores |
| Tools | None. No undo, no eraser, no clear. Only a "Retry" button post-completion. |
| Ink style | Raw — no snap, no smoothing, no post-draw cleanup |

### Scoring

- **3-star system**: < 70% overlap → 1★, 70–90% → 2★, > 90% → 3★
- **Accuracy metric**: pixel distance/overlap between user ink and the guide stroke path
- **Stroke order penalty**: wrong order → 10% deduction on that stroke (hinted via number labels, but not enforced)

### Feedback

- **Full diff overlay** after completion: user ink overlaid on the guide strokes
- **Per-stroke accuracy** color-coded: green (good), yellow (ok), red (poor)
- **Retry**: resets the entire character (no partial retry)
- **Full dictionary entry** shown alongside: pinyin, meaning, radical breakdown, usage example
- **Audio**: TTS pronunciation via Web Speech API (tap to hear)

---

## Content

### V1 scope

- **1 course** ("Essentials") with **2 decks**:
  - Numbers (10 characters)
  - Common (10 characters)
- **~20 essential characters** total, curated starter set

### Future scope

- All HSK levels (1–6), organized into courses and thematic decks
- User-created decks / custom character lists
- Import from external sources (Anki, etc.)

### Character metadata

- Pinyin (with tone marks)
- English meaning
- Radical breakdown
- Usage example sentence
- TTS audio (on-demand)

### Stroke data

- Custom format referencing [HanziWriter](https://github.com/chanind/hanzi-writer-data) for stroke path coordinates
- Bundled as static JSON/TS data — no backend, no API calls
- Each stroke entry includes: path segments, stroke order index, direction hints

---

## Progression & SRS

| Aspect | Decision |
|---|---|
| Lock/unlock | Free pick — no gating. User can access any deck at any time. |
| SRS model | Per-character spaced repetition (independent intervals per character) |
| Graduation | 3★ = graduated; lower ratings recycle into review |
| Review queue | Characters due for review auto-surfaced on the dashboard |

---

## Gamification

- **Stars** visible on each character and deck (overall progress indicator)
- **Daily streak** counter: consecutive days of practice
- **Daily goal**: configurable target (e.g. practice 10 characters)
- **Achievements**: milestone-based (e.g. "First 3★", "10-day streak", "Completed Numbers deck")
- No XP, no levels, no leaderboards

---

## UI/UX

| Aspect | Decision |
|---|---|
| Canvas background | 田字格 (tiánzìgé) grid — the standard Chinese character practice grid |
| Stroke order hints | Number labels at each stroke's start point |
| Canvas sizing | Responsive square, aspect ratio maintained; future-configurable for difficulty scaling |
| Orientation | Both portrait and landscape |
| Dark mode | Supported (inherits from existing design system) |
| Onboarding (V1) | Quick placeholder tutorial overlay |
| Dashboard | SRS-queue-centric: "Today's review: X due" card at top, deck grid below with star progress |
| Input preference | Recommend Pencil, but user can indicate they don't have one (falls back to finger) |

---

## Technical architecture

### Integration

- Lazy-loaded React sub-app under the existing `exio4.github.io` dashboard
- Route: `/apps/stroke/*` (React Router v7)
- Follows existing patterns: `src/apps/stroke/` directory, lazy import in `App.tsx`

### Stack

- React 19 + TypeScript 6 + Vite 8
- No UI library — plain CSS with existing design tokens (light/dark)
- Canvas 2D API for drawing
- Pointer Events API for Pencil input

### Data layer

| Data | Storage |
|---|---|
| Character stroke data | Bundled static JSON/TS (import at build time) |
| User progress (stars, completions) | `localStorage` |
| SRS state (intervals, due dates) | IndexedDB |
| Stroke history (past attempts) | IndexedDB |
| Settings (daily goal, timeout, etc.) | `localStorage` |

### Offline

- Full offline support via service worker
- All assets, character data, and app logic cached on first visit
- Progress and SRS state in IndexedDB — works without internet
- Progress export/import for backup or cross-device use
- Future: share/sync behavior

---

## Design notes

- **No backend.** Everything is client-side. This is a single-page web app on GitHub Pages.
- **Follows ToneForge patterns.** The most complex existing sub-app (ToneForge) has a pure engine separated from React UI, which Stroke should replicate: character data model + scoring engine + SRS engine as pure TypeScript, React components for the UI layer.
- **Pencil is a first-class citizen, not an afterthought.** The `PointerEvent` API provides pressure and tilt; use them for natural brush feel. Detect `pointerType: "pen"` and adjust UI messaging for finger users.
- **Stroke data format.** HanziWriter's open-source stroke data is the reference format. A thin custom wrapper should map it to the app's internal model so the data source can be swapped or extended later (e.g. user-created strokes).
- **Difficulty via canvas size.** Smaller canvas → harder to be accurate. Future feature: user-adjustable or deck-level canvas size as a difficulty slider.
