// toneforge.ts — Pure game-logic engine for Chinese tone training.
// Zero DOM, zero side effects. Consumes pinyin.js and produces state.

import * as P from './pinyin.ts';

// ── types ──────────────────────────────────────────────────────────

export type Tier = 'easy' | 'medium' | 'hard' | 'expert';

export type InitialGroup =
  | 'labials'       // b p m f
  | 'alveolars'     // d t n l
  | 'velars'        // g k h
  | 'palatals'      // j q x
  | 'retroflex'     // zh ch sh r
  | 'dentals'       // z c s
  | 'retroflex_vs_dental'
  | 'aspirated_vs_unaspirated'
  | 'all';

export type DistractorStrategy = 'sameBase' | 'sameTone' | 'sameInitial' | 'mixed';

export interface ToneForgeConfig {
  tier: Tier;
  targetSyllable?: string;               // base only, e.g. "ni" (Easy tier)
  initialGroup?: InitialGroup;           // limit pool to these initials
  roundsPerGame?: number;                // default 10
  distractorsStrategy?: DistractorStrategy; // override tier default
}

export interface SyllableEntry {
  base: string;
  tone: number;
  syllableTone: string;
  fileUrl: string;
}

export interface ToneForgeRound {
  correct: SyllableEntry;
  options: SyllableEntry[];              // includes the correct entry
  correctIndex: number;                  // which option is correct
  audioUrl: string;                      // same as correct.fileUrl
}

export interface AnswerRecord {
  round: number;
  correct: SyllableEntry;
  chosen: SyllableEntry | null;
  chosenIndex: number;
  correct_: boolean;
  replayCount: number;
}

export interface ToneStats {
  byTone: Record<number, { total: number; correct: number }>;
  byInitial: Record<string, { total: number; correct: number }>;
  byFinal: Record<string, { total: number; correct: number }>;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalRounds: number;
  history: AnswerRecord[];
}

export type Phase = 'idle' | 'listening' | 'answered' | 'finished';

export interface ToneForgeState {
  config: ToneForgeConfig;
  roundIndex: number;
  totalRounds: number;
  phase: Phase;
  currentRound: ToneForgeRound | null;
  stats: ToneStats;
}

// ── initial groups ─────────────────────────────────────────────────

const INITIAL_GROUPS: Record<InitialGroup, string[]> = {
  labials:    ['b', 'p', 'm', 'f'],
  alveolars:  ['d', 't', 'n', 'l'],
  velars:     ['g', 'k', 'h'],
  palatals:   ['j', 'q', 'x'],
  retroflex:  ['zh', 'ch', 'sh', 'r'],
  dentals:    ['z', 'c', 's'],
  retroflex_vs_dental: ['zh', 'ch', 'sh', 'r', 'z', 'c', 's'],
  aspirated_vs_unaspirated: ['b', 'p', 'd', 't', 'g', 'k', 'j', 'q', 'zh', 'ch', 'z', 'c'],
  all:        [],
};

function getBasesForGroup(group: InitialGroup): string[] {
  const initials = INITIAL_GROUPS[group];
  if (!initials || initials.length === 0) return P.getAllBases();

  const bases: string[] = [];
  for (const base of P.getAllBases()) {
    for (const init of initials) {
      if (base.startsWith(init)) {
        // ensure it's actually that initial, not just a prefix match
        // e.g. "zha" starts with "zh" ✓, "za" starts with "z" ✓ but
        // "z" should NOT match "zha" or "zhi"
        const remainder = base.slice(init.length);
        if (remainder.length > 0 && !'bcdfghjklmnpqrstvwxyz'.includes(remainder[0] || '')) {
          bases.push(base);
        }
        break;
      }
    }
  }
  // deduplicate and add standalone finals if group is "all"
  if (bases.length === 0) return P.getAllBases();
  return [...new Set(bases)];
}

// ── tier presets ───────────────────────────────────────────────────

interface TierPreset {
  numOptions: number;
  strategy: DistractorStrategy;
  maxReplays: number;       // enforced by UI, noted here for reference
  sameBaseForAllOptions: boolean;
  typed: boolean;           // expert: no options, type answer
}

const TIER_PRESETS: Record<Tier, TierPreset> = {
  easy:    { numOptions: 4, strategy: 'sameBase',   maxReplays: Infinity, sameBaseForAllOptions: true,  typed: false },
  medium:  { numOptions: 4, strategy: 'sameBase',   maxReplays: 3,        sameBaseForAllOptions: false, typed: false },
  hard:    { numOptions: 6, strategy: 'mixed',      maxReplays: 1,        sameBaseForAllOptions: false, typed: false },
  expert:  { numOptions: 0, strategy: 'mixed',      maxReplays: 0,        sameBaseForAllOptions: false, typed: true  },
};

// ── pool filtering ─────────────────────────────────────────────────

function getPool(config: ToneForgeConfig): string[] {
  if (config.targetSyllable) {
    // validate it exists
    if (!P.isValidBase(config.targetSyllable)) {
      throw new Error(`Invalid target syllable: "${config.targetSyllable}"`);
    }
    return [config.targetSyllable];
  }
  if (config.initialGroup) {
    return getBasesForGroup(config.initialGroup);
  }
  return P.getAllBases();
}

// ── distractor generation ──────────────────────────────────────────

function generateOptions(
  correct: SyllableEntry,
  tier: Tier,
  strategy?: DistractorStrategy,
): SyllableEntry[] {
  const preset = TIER_PRESETS[tier];
  const strat = strategy || preset.strategy;
  const count = preset.numOptions;

  if (preset.typed) return [correct]; // expert — no distractors

  // sameBase: all options share the same base, different tones
  if (strat === 'sameBase' || preset.sameBaseForAllOptions) {
    const variants = P.getToneVariants(correct.base);
    if (!variants) return [correct];
    const opts = variants.map((v, i) => ({
      base: correct.base,
      tone: i + 1,
      syllableTone: v.syllableTone,
      fileUrl: v.fileUrl,
    }));
    return shuffle(opts);
  }

  const distractors = P.getDistractors(correct.syllableTone, count - 1, {
    sameTone: strat === 'sameTone',
    sameBase: false,
  });

  // if not enough, fill with random
  if (distractors.length < count - 1) {
    const needed = count - 1 - distractors.length;
    const used = new Set(distractors.map(d => d.syllableTone));
    used.add(correct.syllableTone);
    for (let i = 0; i < needed * 10 && distractors.length < count - 1; i++) {
      const r = P.getRandom();
      if (!used.has(r.syllableTone)) {
        used.add(r.syllableTone);
        distractors.push(r);
      }
    }
  }

  return shuffle([correct, ...distractors.slice(0, count - 1)]);
}

// ── round generation ───────────────────────────────────────────────

function generateRound(state: ToneForgeState): ToneForgeRound {
  const pool = getPool(state.config);

  // pick correct answer — biased toward weak tones if we have history
  const correct = pickCorrectAnswer(pool, state.stats);

  const options = generateOptions(correct, state.config.tier, state.config.distractorsStrategy);
  const correctIndex = options.findIndex(o => o.syllableTone === correct.syllableTone);

  return {
    correct,
    options,
    correctIndex,
    audioUrl: correct.fileUrl,
  };
}

function pickCorrectAnswer(pool: string[], stats: ToneStats): SyllableEntry {
  // 70% of the time: pick from weak tones (adaptive)
  // 30% of the time: pick randomly (keep exposure broad)
  if (Math.random() < 0.7 && stats.totalRounds > 5) {
    const weakTones = getWeakTones(stats);
    if (weakTones.length > 0) {
      const tone = weakTones[Math.floor(Math.random() * Math.min(2, weakTones.length))];
      const base = pool[Math.floor(Math.random() * pool.length)];
      if (P.isValidToneCombo(base, tone)) {
        return P.getByBaseAndTone(base, tone)!;
      }
    }
  }

  const base = pool[Math.floor(Math.random() * pool.length)];
  const tone = Math.floor(Math.random() * 4) + 1;
  return P.getByBaseAndTone(base, tone) || P.getRandom();
}

// ── state machine ──────────────────────────────────────────────────

/** Create a new game. */
export function createGame(config: ToneForgeConfig): ToneForgeState {
  const totalRounds = config.roundsPerGame ?? 10;

  if (config.targetSyllable && !P.isValidBase(config.targetSyllable)) {
    throw new Error(`Invalid targetSyllable: "${config.targetSyllable}"`);
  }

  const state: ToneForgeState = {
    config,
    roundIndex: 0,
    totalRounds,
    phase: 'idle',
    currentRound: null,
    stats: emptyStats(),
  };

  return state;
}

/** Advance to the next round (or finish). Returns updated state. */
export function startRound(state: ToneForgeState): ToneForgeState {
  if (state.roundIndex >= state.totalRounds) {
    return { ...state, phase: 'finished', currentRound: null };
  }

  const round = generateRound(state);
  return {
    ...state,
    currentRound: round,
    phase: 'listening',
  };
}

export interface AnswerResult {
  state: ToneForgeState;
  correct: boolean;
  feedback: {
    chosen: SyllableEntry | null;
    expected: SyllableEntry;
    pointsAwarded: number;
  };
}

/** Submit an answer by option index. */
export function submitAnswer(state: ToneForgeState, choiceIndex: number): AnswerResult {
  if (!state.currentRound || state.phase !== 'listening') {
    throw new Error('Not in listening phase');
  }

  const round = state.currentRound;
  const chosen = round.options[choiceIndex] || null;
  const correct_ = choiceIndex === round.correctIndex;

  const record: AnswerRecord = {
    round: state.roundIndex + 1,
    correct: round.correct,
    chosen,
    chosenIndex: choiceIndex,
    correct_,
    replayCount: 0,
  };

  const stats = updateStats(state.stats, record);
  const points = correct_ ? 100 : 0;

  return {
    state: {
      ...state,
      phase: 'answered',
      stats,
    },
    correct: correct_,
    feedback: {
      chosen,
      expected: round.correct,
      pointsAwarded: points,
    },
  };
}

/** Move to the next round. */
export function advanceRound(state: ToneForgeState): ToneForgeState {
  const nextIndex = state.roundIndex + 1;

  if (nextIndex >= state.totalRounds) {
    return { ...state, phase: 'finished', currentRound: null, roundIndex: nextIndex };
  }

  const next = startRound({ ...state, roundIndex: nextIndex, phase: 'idle' });
  return next;
}

// ── stats ──────────────────────────────────────────────────────────

function emptyStats(): ToneStats {
  return {
    byTone: {},
    byInitial: {},
    byFinal: {},
    streak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalRounds: 0,
    history: [],
  };
}

function updateStats(stats: ToneStats, record: AnswerRecord): ToneStats {
  const next = { ...stats };
  next.totalRounds++;
  next.history = [...stats.history, record];

  if (record.correct_) {
    next.totalCorrect++;
    next.streak++;
    if (next.streak > next.bestStreak) next.bestStreak = next.streak;
    incTone(next, record.correct.tone, true);
    incInitial(next, record.correct.base, true);
  } else {
    next.streak = 0;
    incTone(next, record.correct.tone, false);
    incInitial(next, record.correct.base, false);
  }

  return next;
}

function incTone(stats: ToneStats, tone: number, correct: boolean) {
  if (!stats.byTone[tone]) stats.byTone[tone] = { total: 0, correct: 0 };
  stats.byTone[tone].total++;
  if (correct) stats.byTone[tone].correct++;
}

function incInitial(stats: ToneStats, base: string, correct: boolean) {
  const initial = getInitial(base);
  if (!stats.byInitial[initial]) stats.byInitial[initial] = { total: 0, correct: 0 };
  stats.byInitial[initial].total++;
  if (correct) stats.byInitial[initial].correct++;
}

function getInitial(base: string): string {
  for (const init of ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
    'g', 'k', 'h', 'j', 'q', 'x', 'z', 'c', 's', 'r', 'y', 'w']) {
    if (base.startsWith(init)) return init;
  }
  return base[0] || '?';
}

/** Get accuracy percentage for each tone, sorted weakest first. */
export function getWeakTones(stats: ToneStats): number[] {
  const tones = [1, 2, 3, 4];
  return tones.sort((a, b) => {
    const aa = stats.byTone[a];
    const bb = stats.byTone[b];
    const accA = aa && aa.total > 0 ? aa.correct / aa.total : 1;
    const accB = bb && bb.total > 0 ? bb.correct / bb.total : 1;
    return accA - accB;
  });
}

/** Get initials sorted by accuracy, weakest first. */
export function getWeakInitials(stats: ToneStats): string[] {
  return Object.entries(stats.byInitial)
    .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
    .map(([init]) => init);
}

export function getStats(state: ToneForgeState): ToneStats {
  return state.stats;
}

/** Suggest a config to practice weak areas. */
export function suggestNextConfig(stats: ToneStats): Partial<ToneForgeConfig> {
  if (stats.totalRounds < 5) return {};

  const weakInitials = getWeakInitials(stats);

  // pick a tier: if >80% overall → hard, if >60% → medium, else easy
  const overall = stats.totalCorrect / stats.totalRounds;
  const tier: Tier = overall > 0.8 ? 'hard' : overall > 0.6 ? 'medium' : 'easy';

  // if a specific initial is very weak (<50%), focus on it
  const veryWeak = weakInitials.filter(init => {
    const d = stats.byInitial[init];
    return d && d.total >= 3 && d.correct / d.total < 0.5;
  });

  if (veryWeak.length > 0) {
    return { tier, initialGroup: 'all', distractorsStrategy: 'mixed' };
  }

  return { tier };
}

// ── helpers ────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── presets (convenience) ──────────────────────────────────────────

/** Quick preset: practice a single syllable's tones (Easy tier). */
export function presetSingleSyllable(base: string): ToneForgeConfig {
  return {
    tier: 'easy',
    targetSyllable: base,
    roundsPerGame: 10,
  };
}

/** Quick preset: practice an initial group (Medium tier). */
export function presetInitialGroup(group: InitialGroup): ToneForgeConfig {
  return {
    tier: 'medium',
    initialGroup: group,
    roundsPerGame: 10,
  };
}

/** Quick preset: contrast two initial groups (Hard tier). */
export function presetContrast(): ToneForgeConfig {
  // Not directly supported by a single group — use 'all' and let the
  // user configure at a higher level, or combine manually.
  return {
    tier: 'hard',
    initialGroup: 'all',
    roundsPerGame: 10,
  };
}

/** Quick preset: full dictation (Expert tier). */
export function presetDictation(): ToneForgeConfig {
  return {
    tier: 'expert',
    initialGroup: 'all',
    roundsPerGame: 15,
  };
}
