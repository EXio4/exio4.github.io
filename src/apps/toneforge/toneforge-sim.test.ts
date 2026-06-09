// toneforge-sim.test.ts — Simulates full game sessions against ToneForge engine.
// Feeds known good & bad data. Designed to be reusable as E2E test scenarios
// once the UI exists (swap the assertions for DOM queries).

import {
  createGame,
  startRound,
  submitAnswer,
  advanceRound,
  getStats,
  getWeakTones,
  suggestNextConfig,
  presetSingleSyllable,
  presetInitialGroup,
  presetDictation,
  type ToneForgeState,
  type Tier,
  type InitialGroup,
} from './toneforge.ts';

// ── helpers ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function ok(cond: boolean, msg: string) {
  if (cond) { passed++; return; }
  failed++;
  console.error(`  ✗ FAIL: ${msg}`);
}

function eq<T>(a: T, b: T, msg: string) {
  if (a === b) { passed++; return; }
  failed++;
  console.error(`  ✗ FAIL: ${msg}  (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

function summary(label: string) {
  console.log(`\n${label} — ${passed + failed} assertions, ${failed ? `${failed} FAILURES` : 'all passed'}`);
  const p = passed, f = failed;
  passed = 0; failed = 0;
  return { p, f };
}

let totalPassed = 0;
let totalFailed = 0;
function grandTotal() {
  totalPassed += passed;
  totalFailed += failed;
}

// ── scenario runner: play a full game ──────────────────────────────

interface SimResult {
  state: ToneForgeState;
  score: number;
  accuracy: number;
}

/** Play through remaining rounds by always picking the correct answer. */
function playPerfect(state: ToneForgeState): SimResult {
  let s = state;
  let score = 0;
  const remaining = s.totalRounds - s.roundIndex;

  for (let i = 0; i < remaining; i++) {
    s = startRound(s);
    if (s.phase === 'finished' || !s.currentRound) break;
    const round = s.currentRound;
    const { state: next, correct: isCorrect } = submitAnswer(s, round.correctIndex);
    s = next;
    if (isCorrect) score++;
    s = advanceRound(s);
  }

  return { state: s, score, accuracy: s.totalRounds > 0 ? score / s.totalRounds : 0 };
}

/** Play through remaining rounds by always giving the wrong answer. */
function playAllWrong(state: ToneForgeState): SimResult {
  let s = state;
  const remaining = s.totalRounds - s.roundIndex;

  for (let i = 0; i < remaining; i++) {
    s = startRound(s);
    if (s.phase === 'finished' || !s.currentRound) break;
    const round = s.currentRound;
    const wrongIdx = round.options.findIndex((_, idx) => idx !== round.correctIndex);
    const { state: next } = submitAnswer(s, wrongIdx >= 0 ? wrongIdx : 0);
    s = next;
    s = advanceRound(s);
  }

  return { state: s, score: 0, accuracy: 0 };
}

// ════════════════════════════════════════════════════════════════════
// SECTION 1: Presets
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 1: Presets ===');

{
  const cfg = presetSingleSyllable('ni');
  eq(cfg.tier, 'easy', 'presetSingleSyllable sets easy tier');
  eq(cfg.targetSyllable, 'ni', 'presetSingleSyllable sets target ni');
  eq(cfg.roundsPerGame, 10, 'presetSingleSyllable defaults to 10 rounds');
}

{
  const cfg = presetInitialGroup('labials');
  eq(cfg.tier, 'medium', 'presetInitialGroup sets medium tier');
  eq(cfg.initialGroup, 'labials', 'presetInitialGroup sets labials group');
}

{
  const cfg = presetDictation();
  eq(cfg.tier, 'expert', 'presetDictation sets expert tier');
  eq(cfg.roundsPerGame, 15, 'presetDictation defaults to 15 rounds');
}

grandTotal(); summary('Presets');

// ════════════════════════════════════════════════════════════════════
// SECTION 2: Easy tier — single syllable, perfect play
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 2: Easy tier — perfect play ===');

const easyCfg = presetSingleSyllable('ma');
easyCfg.roundsPerGame = 12;

let easyState = createGame(easyCfg);
eq(easyState.phase, 'idle', 'Easy: initial phase is idle');
eq(easyState.roundIndex, 0, 'Easy: starts at round 0');
eq(easyState.totalRounds, 12, 'Easy: totalRounds = 12');
eq(easyState.stats.totalRounds, 0, 'Easy: initial stats empty');
eq(easyState.currentRound, null, 'Easy: no round yet');

// Play round 1
easyState = startRound(easyState);
const easyR1 = easyState.currentRound!;
eq(easyState.phase, 'listening', 'Easy R1: phase is listening');
ok(easyR1 !== null, 'Easy R1: round generated');
eq(easyR1.correct.base, 'ma', 'Easy R1: correct answer base is "ma"');
ok(easyR1.correct.tone >= 1 && easyR1.correct.tone <= 4, 'Easy R1: tone is 1-4');
ok(easyR1.options.length === 4, 'Easy R1: 4 options (all tones of ma)');

// All options should be the same base "ma" with tones 1-4
const easyBases = easyR1.options.map(o => o.base);
const easyTones = easyR1.options.map(o => o.tone).sort();
ok(easyBases.every(b => b === 'ma'), 'Easy R1: all options have base "ma"');
eq(JSON.stringify(easyTones), JSON.stringify([1, 2, 3, 4]), 'Easy R1: options cover all 4 tones');

// The correct index must point to the right tone
eq(easyR1.options[easyR1.correctIndex].tone, easyR1.correct.tone, 'Easy R1: correctIndex matches tone');
eq(easyR1.audioUrl, easyR1.correct.fileUrl, 'Easy R1: audioUrl matches');

// Wrong answer
const { state: easyWrong, correct: easyWrongCorrect } = submitAnswer(easyState, (easyR1.correctIndex + 1) % 4);
eq(easyWrongCorrect, false, 'Easy R1: wrong answer → correct=false');
eq(easyWrong.phase, 'answered', 'Easy R1: wrong answer → phase=answered');
eq(easyWrong.stats.totalRounds, 1, 'Easy R1: stats recorded');
eq(easyWrong.stats.totalCorrect, 0, 'Easy R1: no correct');
eq(easyWrong.stats.streak, 0, 'Easy R1: streak=0 after wrong');

// Advance to next
const easyNext = advanceRound(easyWrong);
eq(easyNext.roundIndex, 1, 'Easy R2: roundIndex=1 after advance');
easyState = easyNext;

// Play rest perfectly
const easyResult = playPerfect(easyState);
eq(easyResult.state.phase, 'finished', 'Easy: game finished');
eq(easyResult.score, 11, 'Easy: 11/12 correct (one wrong)');

const easyStats = getStats(easyResult.state);
eq(easyStats.totalRounds, 12, 'Easy: stats show 12 rounds');
eq(easyStats.totalCorrect, 11, 'Easy: stats show 11 correct');
eq(easyStats.history.length, 12, 'Easy: 12 history records');
ok(easyStats.history[0].correct_ === false, 'Easy: first record is the wrong answer');
ok(easyStats.history[1].correct_ === true, 'Easy: second record is correct');

grandTotal(); summary('Easy tier');

// ════════════════════════════════════════════════════════════════════
// SECTION 3: Medium tier — initial group, all wrong
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 3: Medium tier — all wrong ===');

let medCheckState = createGame(presetInitialGroup('retroflex'));

// All rounds should use syllables starting with zh/ch/sh/r
for (let i = 0; i < medCheckState.totalRounds; i++) {
  medCheckState = startRound(medCheckState);
  const round = medCheckState.currentRound!;
  const init = round.correct.base.slice(0, 2);
  const validInits = ['zh', 'ch', 'sh'];
  ok(
    validInits.includes(init) || round.correct.base.startsWith('r'),
    `Medium R${i + 1}: base "${round.correct.base}" starts with zh/ch/sh/r`
  );
  // answer correctly to advance
  const { state: next } = submitAnswer(medCheckState, round.correctIndex);
  medCheckState = next;
  medCheckState = advanceRound(medCheckState);
}

const medWrongResult = playAllWrong(createGame(presetInitialGroup('retroflex')));
eq(medWrongResult.score, 0, 'Medium all-wrong: score=0');
eq(medWrongResult.accuracy, 0, 'Medium all-wrong: accuracy=0');

const medWrongStats = getStats(medWrongResult.state);
eq(medWrongStats.streak, 0, 'Medium all-wrong: streak=0');
eq(medWrongStats.bestStreak, 0, 'Medium all-wrong: bestStreak=0');

grandTotal(); summary('Medium tier');

// ════════════════════════════════════════════════════════════════════
// SECTION 4: Hard tier — more options, minimal pairs feel
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 4: Hard tier ===');

const hardState = createGame({
  tier: 'hard',
  initialGroup: 'retroflex_vs_dental',
  roundsPerGame: 8,
});

const s1 = startRound(hardState);
const hardR1 = s1.currentRound!;
ok(hardR1.options.length === 6, 'Hard R1: 6 options');
ok(hardR1.options.some(o => o.syllableTone === hardR1.correct.syllableTone), 'Hard R1: correct option present');
eq(hardR1.options[hardR1.correctIndex].syllableTone, hardR1.correct.syllableTone, 'Hard R1: correctIndex accurate');

// Verify all options have valid syllables
ok(hardR1.options.every(o => o.syllableTone.length > 0 && o.fileUrl.includes('mp3')), 'Hard R1: all options have valid data');

grandTotal(); summary('Hard tier');

// ════════════════════════════════════════════════════════════════════
// SECTION 5: Expert tier — typed mode, no options
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 5: Expert tier ===');

const expertState = createGame(presetDictation());
const e1 = startRound(expertState);
const expertR1 = e1.currentRound!;
ok(expertR1.options.length === 1, 'Expert: only 1 entry (the correct one)');
eq(expertR1.options[0].syllableTone, expertR1.correct.syllableTone, 'Expert: option IS the correct answer');
eq(expertR1.options.length, 1, 'Expert: no distractors (typed mode — UI handles validation)');

grandTotal(); summary('Expert tier');

// ════════════════════════════════════════════════════════════════════
// SECTION 6: Stats & adaptive logic
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 6: Stats & adaptive ===');

// Build a state with known bad performance on tone 3
const statsState = createGame({ tier: 'easy', targetSyllable: 'ni', roundsPerGame: 20 });
let ss = statsState;

// Purposefully answer wrong for all tone-3 rounds, correct for others
for (let i = 0; i < 20; i++) {
  ss = startRound(ss);
  const round = ss.currentRound!;
  const isTone3 = round.correct.tone === 3;
  const idx = isTone3
    ? round.options.findIndex((_, oi) => oi !== round.correctIndex) // wrong
    : round.correctIndex; // correct
  const { state: next } = submitAnswer(ss, idx);
  ss = next;
  ss = advanceRound(ss);
}

const sStats = getStats(ss);
eq(sStats.totalRounds, 20, 'Stats: 20 rounds');

const weakTones = getWeakTones(sStats);
ok(weakTones.length === 4, 'Stats: 4 tones in weakTones');
ok(weakTones[0] === 3, 'Stats: tone 3 is weakest (first in list)');

const suggestion = suggestNextConfig(sStats);
ok(suggestion.tier !== undefined, 'Adaptive: suggests a tier');
console.log(`  Adaptive suggests tier: ${suggestion.tier}`);

grandTotal(); summary('Stats & adaptive');

// ════════════════════════════════════════════════════════════════════
// SECTION 7: Group filtering accuracy
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 7: Group filtering ===');

function checkGroup(name: string, group: InitialGroup, expectedInits: string[]) {
  const st = createGame({ tier: 'medium', initialGroup: group, roundsPerGame: 5 });
  let s = st;
  let allOk = true;
  const basesSeen: string[] = [];

  for (let i = 0; i < 5; i++) {
    s = startRound(s);
    const round = s.currentRound!;
    basesSeen.push(round.correct.base);
    const matches = expectedInits.some(init => {
      if (round.correct.base.startsWith(init)) {
        const rem = round.correct.base.slice(init.length);
        return rem.length > 0 && !'bcdfghjklmnpqrstvwxyz'.includes(rem[0] || '');
      }
      return false;
    });
    if (!matches) allOk = false;
    const { state: next } = submitAnswer(s, round.correctIndex);
    s = next;
    s = advanceRound(s);
  }

  ok(allOk, `Group "${name}": all bases match expected initials ${expectedInits.join(',')}`);
  console.log(`  Group "${name}" bases seen: ${[...new Set(basesSeen)].slice(0, 8).join(', ')}`);
}

checkGroup('labials',   'labials',   ['b', 'p', 'm', 'f']);
checkGroup('palatals',  'palatals',  ['j', 'q', 'x']);
checkGroup('dentals',   'dentals',   ['z', 'c', 's']);
checkGroup('retroflex', 'retroflex', ['zh', 'ch', 'sh', 'r']);

grandTotal(); summary('Group filtering');

// ════════════════════════════════════════════════════════════════════
// SECTION 8: Edge cases & error handling
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 8: Edge cases ===');

// Invalid target syllable
try {
  createGame({ tier: 'easy', targetSyllable: 'xyz123', roundsPerGame: 5 });
  ok(false, 'Edge: should throw on invalid targetSyllable');
} catch (e: unknown) {
  ok((e as Error).message.includes('xyz123'), 'Edge: throws with invalid syllable message');
}

// Submit answer when not in listening phase
const edgeState = createGame({ tier: 'easy', targetSyllable: 'ni', roundsPerGame: 5 });
try {
  submitAnswer(edgeState, 0);
  ok(false, 'Edge: should throw on submit when not listening');
} catch (e: unknown) {
  ok((e as Error).message.includes('Not in listening phase'), 'Edge: throws on bad phase');
}

// Out of bounds option index
const es1 = startRound(edgeState);
const { state: esAns } = submitAnswer(es1, 0);
eq(esAns.phase, 'answered', 'Edge: valid answer transitions to answered');

// Advance past last round
const esFinished = advanceRound(advanceRound(advanceRound(advanceRound(advanceRound(esAns)))));
eq(esFinished.phase, 'finished', 'Edge: phase=finished after last round');
eq(esFinished.currentRound, null, 'Edge: no round when finished');

// startRound on finished game — should stay finished
const esDone = startRound(esFinished);
eq(esDone.phase, 'finished', 'Edge: startRound on finished stays finished');

// Zero round game — should finish immediately (roundIndex 0 >= totalRounds 0)
const zeroState = createGame({ tier: 'easy', targetSyllable: 'ni', roundsPerGame: 0 });
eq(zeroState.totalRounds, 0, 'Edge: zero-round game has totalRounds=0');
eq(zeroState.roundIndex, 0, 'Edge: zero-round game roundIndex=0');
const zeroStarted = startRound(zeroState);
eq(zeroStarted.phase, 'finished', 'Edge: zero-round game finishes immediately');
eq(zeroStarted.currentRound, null, 'Edge: zero-round game has no current round');

grandTotal(); summary('Edge cases');

// ════════════════════════════════════════════════════════════════════
// SECTION 9: Round integrity — no duplicate options, correct answer present
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 9: Round integrity ===');

const tiers: Tier[] = ['easy', 'medium', 'hard'];
for (const tier of tiers) {
  const state = createGame({ tier, initialGroup: 'all', roundsPerGame: 3 });
  let s = state;
  for (let i = 0; i < 3; i++) {
    s = startRound(s);
    const round = s.currentRound!;

    // Correct answer must be in options
    ok(
      round.options.some(o => o.syllableTone === round.correct.syllableTone),
      `${tier} R${i + 1}: correct answer in options`
    );

    // correctIndex must point to actual correct
    eq(
      round.options[round.correctIndex].syllableTone,
      round.correct.syllableTone,
      `${tier} R${i + 1}: correctIndex accurate`
    );

    // No duplicate option labels (syllableTone)
    const labels = round.options.map(o => o.syllableTone);
    eq(labels.length, new Set(labels).size, `${tier} R${i + 1}: no duplicate options`);

    // All fileUrls should be valid MP3 URLs
    ok(
      round.options.every(o => o.fileUrl.startsWith('https://') && o.fileUrl.endsWith('.mp3')),
      `${tier} R${i + 1}: all option URLs valid`
    );

    const { state: next } = submitAnswer(s, round.correctIndex);
    s = next;
    s = advanceRound(s);
  }
}

grandTotal(); summary('Round integrity');

// ════════════════════════════════════════════════════════════════════
// SECTION 10: Streak tracking
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 10: Streak tracking ===');

const streakState = createGame({ tier: 'easy', targetSyllable: 'ba', roundsPerGame: 6 });
let ss2 = streakState;

// Round 1: correct
ss2 = startRound(ss2);
const { state: a1 } = submitAnswer(ss2, ss2.currentRound!.correctIndex);
eq(getStats(a1).streak, 1, 'Streak: 1 after first correct');
ss2 = advanceRound(a1);

// Round 2: correct
ss2 = startRound(ss2);
const { state: a2 } = submitAnswer(ss2, ss2.currentRound!.correctIndex);
eq(getStats(a2).streak, 2, 'Streak: 2 after second correct');
ss2 = advanceRound(a2);

// Round 3: wrong (pick a non-correct index)
ss2 = startRound(ss2);
const wrongIdx = (ss2.currentRound!.correctIndex + 1) % 4;
const { state: a3 } = submitAnswer(ss2, wrongIdx);
eq(getStats(a3).streak, 0, 'Streak: 0 after wrong answer');
eq(getStats(a3).bestStreak, 2, 'Streak: bestStreak=2 preserved');
ss2 = advanceRound(a3);

// Rounds 4-6: correct
for (let i = 0; i < 3; i++) {
  ss2 = startRound(ss2);
  const { state: next } = submitAnswer(ss2, ss2.currentRound!.correctIndex);
  ss2 = next;
  ss2 = advanceRound(ss2);
}
const streakFinal = getStats(ss2);
eq(streakFinal.streak, 3, 'Streak: 3 after 3 final corrects');
eq(streakFinal.bestStreak, 3, 'Streak: bestStreak updated to 3');

grandTotal(); summary('Streak tracking');

// ════════════════════════════════════════════════════════════════════
// SECTION 11: Distractor strategy diversity
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 11: Distractor strategies ===');

// sameBase strategy — all options share the base
const sbState = createGame({
  tier: 'medium',
  targetSyllable: 'ta',
  distractorsStrategy: 'sameBase',
  roundsPerGame: 2,
});
let sb = sbState;
for (let i = 0; i < 2; i++) {
  sb = startRound(sb);
  const round = sb.currentRound!;
  const bases = round.options.map(o => o.base);
  ok(bases.every(b => b === round.correct.base), `sameBase R${i + 1}: all options share base`);
  const { state: next } = submitAnswer(sb, round.correctIndex);
  sb = next;
  sb = advanceRound(sb);
}

// sameTone strategy — all options share the tone
const stState = createGame({
  tier: 'hard',
  initialGroup: 'all',
  distractorsStrategy: 'sameTone',
  roundsPerGame: 2,
});
let st2 = stState;
for (let i = 0; i < 2; i++) {
  st2 = startRound(st2);
  const round = st2.currentRound!;
  const tones = round.options.map(o => o.tone);
  ok(tones.every(t => t === round.correct.tone), `sameTone R${i + 1}: all options share tone ${round.correct.tone}`);
  const { state: next } = submitAnswer(st2, round.correctIndex);
  st2 = next;
  st2 = advanceRound(st2);
}

grandTotal(); summary('Distractor strategies');

// ════════════════════════════════════════════════════════════════════
// SECTION 12: Full-game scenarios (for future E2E)
// ════════════════════════════════════════════════════════════════════

console.log('=== SECTION 12: Full-game scenarios ===');

interface Scenario {
  name: string;
  config: Parameters<typeof createGame>[0];
  play: (state: ToneForgeState) => ToneForgeState;
  expectedPhase: string;
  minScore: number;
  minAccuracy: number;
}

const scenarios: Scenario[] = [
  {
    name: 'Easy: ni mastery',
    config: presetSingleSyllable('ni'),
    play: (s) => playPerfect(s).state,
    expectedPhase: 'finished',
    minScore: 10,
    minAccuracy: 1.0,
  },
  {
    name: 'Medium: labials practice',
    config: presetInitialGroup('labials'),
    play: (s) => playPerfect(s).state,
    expectedPhase: 'finished',
    minScore: 10,
    minAccuracy: 1.0,
  },
  {
    name: 'Hard: retroflex vs dental struggle',
    config: { tier: 'hard', initialGroup: 'retroflex_vs_dental', roundsPerGame: 6 },
    play: (s) => playAllWrong(s).state,
    expectedPhase: 'finished',
    minScore: 0,
    minAccuracy: 0,
  },
  {
    name: 'Expert: dictation perfect',
    config: presetDictation(),
    play: (s) => playPerfect(s).state,
    expectedPhase: 'finished',
    minScore: 15,
    minAccuracy: 1.0,
  },
];

for (const sc of scenarios) {
  const state = createGame(sc.config);
  const final = sc.play(state);
  eq(final.phase, sc.expectedPhase, `Scenario "${sc.name}": phase=${final.phase}`);
  const stats = getStats(final);
  ok(stats.totalCorrect >= sc.minScore, `Scenario "${sc.name}": score=${stats.totalCorrect} >= ${sc.minScore}`);
  ok(
    stats.totalCorrect / stats.totalRounds >= sc.minAccuracy,
    `Scenario "${sc.name}": accuracy=${(stats.totalCorrect / stats.totalRounds).toFixed(2)} >= ${sc.minAccuracy}`
  );
}

grandTotal(); summary('Full-game scenarios');

// ════════════════════════════════════════════════════════════════════
// GRAND TOTAL
// ════════════════════════════════════════════════════════════════════

console.log(`\n═══════════════════════════════════════════`);
console.log(`  GRAND TOTAL: ${totalPassed + totalFailed} assertions`);
console.log(`  Passed: ${totalPassed}  |  Failed: ${totalFailed}`);
console.log(`═══════════════════════════════════════════`);

if (totalFailed > 0) throw new Error(`${totalFailed} test(s) failed`);
