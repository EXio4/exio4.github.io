import data from './pinyin.json';

// ── types ────────────────────────────────────────────────────────────

export interface SyllableVariant {
  syllableTone: string;
  fileUrl: string;
}

export interface SyllableEntry {
  base: string;
  tone: number;
  syllableTone: string;
  fileUrl: string;
}

export interface GroupedResult {
  base: string;
  tones: SyllableVariant[];
}

// ── tone detection ──────────────────────────────────────────────────

const TONE_MARK_TO_NUMBER: Record<string, number> = {
  ā: 1, á: 2, ǎ: 3, à: 4,
  ē: 1, é: 2, ě: 3, è: 4,
  ī: 1, í: 2, ǐ: 3, ì: 4,
  ō: 1, ó: 2, ǒ: 3, ò: 4,
  ū: 1, ú: 2, ǔ: 3, ù: 4,
  ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4,
};

function extractToneNumber(syllableTone: string): number {
  for (const ch of syllableTone) {
    if (TONE_MARK_TO_NUMBER[ch]) return TONE_MARK_TO_NUMBER[ch];
  }
  return 0;
}

// ── indexes ──────────────────────────────────────────────────────────

const baseIndex = new Map<string, SyllableVariant[]>();
const toneMarkedIndex = new Map<string, SyllableEntry>();
const toneIndex = new Map<number, SyllableEntry[]>();
const allBases: string[] = [];

for (const [base, tones] of data as Array<[string, SyllableVariant[]]>) {
  baseIndex.set(base, tones);
  allBases.push(base);
  for (const t of tones) {
    const toneNum = extractToneNumber(t.syllableTone);
    const entry: SyllableEntry = { base, tone: toneNum, syllableTone: t.syllableTone, fileUrl: t.fileUrl };
    toneMarkedIndex.set(t.syllableTone, entry);

    if (!toneIndex.has(toneNum)) toneIndex.set(toneNum, []);
    toneIndex.get(toneNum)!.push(entry);
  }
}

// ── validation ─────────────────────────────────────────────────────

/** Check if a base syllable (e.g. "ni") exists in the chart. */
export function isValidBase(base: string): boolean {
  return baseIndex.has(base);
}

/** Check if a tone-marked syllable (e.g. "nǐ") exists in the chart. */
export function isValidSyllable(syllableTone: string): boolean {
  return toneMarkedIndex.has(syllableTone);
}

/** Check if a base + tone number combination is valid. */
export function isValidToneCombo(base: string, tone: number): boolean {
  const tones = baseIndex.get(base);
  if (!tones) return false;
  return tone >= 1 && tone <= 4 && !!tones[tone - 1];
}

// ── lookup ─────────────────────────────────────────────────────────

/** Get all 4 tone variants for a base syllable. */
export function getToneVariants(base: string): SyllableVariant[] | null {
  return baseIndex.get(base) ?? null;
}

/** Get the audio URL for a base syllable + tone number. */
export function getToneUrl(base: string, tone: number): string | null {
  const tones = baseIndex.get(base);
  if (!tones || tone < 1 || tone > 4) return null;
  return tones[tone - 1].fileUrl;
}

/** Get the tone-marked form (e.g. "ni" + 3 → "nǐ"). */
export function getSyllableTone(base: string, tone: number): string | null {
  const tones = baseIndex.get(base);
  if (!tones || tone < 1 || tone > 4) return null;
  return tones[tone - 1].syllableTone;
}

/** Get the audio URL for a tone-marked syllable (e.g. "nǐ"). */
export function getUrlFromToneMarked(syllableTone: string): string | null {
  const entry = toneMarkedIndex.get(syllableTone);
  return entry ? entry.fileUrl : null;
}

// ── suggestion / autocomplete ──────────────────────────────────────

export function suggest(
  query: string,
  opts: { limit?: number; mode?: 'prefix' | 'substring' | 'fuzzy' } = {},
): SyllableEntry[] {
  const { limit = 20, mode = 'prefix' } = opts;
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // tone-marked exact match → always return immediately
  if (toneMarkedIndex.has(q)) return [toneMarkedIndex.get(q)!];

  // number-format "ni3" → return immediately
  const numMatch = q.match(/^([a-zü]+)([1-4])$/);
  if (numMatch) {
    const base = numMatch[1];
    const tone = parseInt(numMatch[2]);
    if (baseIndex.has(base)) {
      const variant = baseIndex.get(base)![tone - 1];
      return [{ base, tone, syllableTone: variant.syllableTone, fileUrl: variant.fileUrl }];
    }
  }

  // exact base match in prefix mode → return 4 tones immediately
  if (mode === 'prefix' && baseIndex.has(q)) {
    return baseIndex.get(q)!.map((t, i) => ({
      base: q, tone: i + 1, syllableTone: t.syllableTone, fileUrl: t.fileUrl,
    }));
  }

  // prefix / substring / fuzzy search
  const results: SyllableEntry[] = [];
  const seen = new Set<string>();

  const add = (entry: SyllableEntry) => {
    const key = entry.base + entry.tone;
    if (seen.has(key) || results.length >= limit) return;
    seen.add(key);
    results.push(entry);
  };

  for (const base of allBases) {
    if (results.length >= limit) break;

    let matches = false;
    if (mode === 'prefix') {
      matches = base.startsWith(q);
    } else if (mode === 'substring') {
      matches = base.includes(q);
    } else if (mode === 'fuzzy') {
      matches = fuzzyMatch(base, q);
    }

    if (matches) {
      const tones = baseIndex.get(base)!;
      for (let i = 0; i < tones.length && results.length < limit; i++) {
        add({ base, tone: i + 1, syllableTone: tones[i].syllableTone, fileUrl: tones[i].fileUrl });
      }
    }
  }

  return results;
}

function fuzzyMatch(str: string, query: string): boolean {
  let qi = 0;
  for (let si = 0; si < str.length && qi < query.length; si++) {
    if (str[si] === query[qi]) qi++;
  }
  return qi === query.length;
}

// ── search by category ─────────────────────────────────────────────

/** Get all syllables for a given tone number (1-4). */
export function searchByTone(tone: number): SyllableEntry[] {
  return toneIndex.get(tone) || [];
}

/** Get all syllables starting with a given initial consonant. */
export function searchByInitial(initial: string): SyllableEntry[] {
  const results: SyllableEntry[] = [];
  for (const base of allBases) {
    if (base.startsWith(initial)) {
      const tones = baseIndex.get(base)!;
      for (let i = 0; i < tones.length; i++) {
        results.push({
          base, tone: i + 1,
          syllableTone: tones[i].syllableTone,
          fileUrl: tones[i].fileUrl,
        });
      }
    }
  }
  return results;
}

/** Get all syllables ending with a given final (e.g. "an", "ang", "i"). */
export function searchByFinal(final: string): SyllableEntry[] {
  const results: SyllableEntry[] = [];
  for (const base of allBases) {
    if (base.endsWith(final) && base !== final) {
      const tones = baseIndex.get(base)!;
      for (let i = 0; i < tones.length; i++) {
        results.push({
          base, tone: i + 1,
          syllableTone: tones[i].syllableTone,
          fileUrl: tones[i].fileUrl,
        });
      }
    }
  }
  return results;
}

// ── normalization ──────────────────────────────────────────────────

/**
 * Normalize various input formats to a canonical {base, tone} object.
 * Accepts: "nǐ", "ni3", "NI3", "ni 3", {base:"ni", tone:3}
 */
export function normalize(
  input: string | { base: string; tone: number },
): { base: string; tone: number } | null {
  if (typeof input === 'object' && input !== null) {
    if (input.base && typeof input.tone === 'number') {
      return { base: input.base.toLowerCase(), tone: input.tone };
    }
    return null;
  }
  if (typeof input !== 'string') return null;

  const s = input.trim().toLowerCase();

  // "ni3" format
  const numMatch = s.match(/^([a-zü]+)\s*([1-4])$/);
  if (numMatch) {
    return { base: numMatch[1], tone: parseInt(numMatch[2]) };
  }

  // tone-marked format "nǐ"
  const entry = toneMarkedIndex.get(s);
  if (entry) return { base: entry.base, tone: entry.tone };

  // bare base (no tone)
  if (baseIndex.has(s)) return { base: s, tone: 0 };

  return null;
}

/** Strip tone marks from a syllable to get the base form. */
export function stripTone(syllableTone: string): string {
  let base = '';
  for (const ch of syllableTone) {
    base += TONE_MARK_TO_NUMBER[ch]
      ? (ch === 'ǖ' || ch === 'ǘ' || ch === 'ǚ' || ch === 'ǜ' ? 'ü' : ch.normalize('NFD')[0])
      : ch;
  }
  return base;
}

// ── format conversion ──────────────────────────────────────────────

/** Convert tone-marked "nǐ" → number format "ni3". */
export function toNumberFormat(syllableTone: string): string {
  const tone = extractToneNumber(syllableTone);
  if (!tone) return syllableTone;
  return stripTone(syllableTone) + tone;
}

/** Convert base + tone → tone-marked form. "ni" + 3 → "nǐ". */
export function toMarkFormat(base: string, tone: number): string | null {
  return getSyllableTone(base, tone);
}

// ── data access ────────────────────────────────────────────────────

/** Get all valid base syllables (sorted). */
export function getAllBases(): string[] {
  return [...allBases];
}

/** Get all valid tone-marked syllables. */
export function getAllSyllableTones(): string[] {
  return [...toneMarkedIndex.keys()];
}

/** Get a random {base, tone, syllableTone, fileUrl} entry. */
export function getRandom(): SyllableEntry {
  const base = allBases[Math.floor(Math.random() * allBases.length)];
  const tone = Math.floor(Math.random() * 4) + 1;
  const variant = baseIndex.get(base)![tone - 1];
  return { base, tone, syllableTone: variant.syllableTone, fileUrl: variant.fileUrl };
}

/** Get a random entry for a specific tone (1-4). */
export function getRandomByTone(tone: number): SyllableEntry | null {
  const entries = toneIndex.get(tone);
  if (!entries || entries.length === 0) return null;
  return entries[Math.floor(Math.random() * entries.length)];
}

/** Get total count of base syllables. */
export function getBaseCount(): number {
  return allBases.length;
}

/** Get total count of tone-marked syllables. */
export function getSyllableToneCount(): number {
  return toneMarkedIndex.size;
}

// ── suggestion (grouped) ───────────────────────────────────────────

/**
 * Like `suggest` but groups results by base (one entry per base
 * with all 4 tones), for cleaner autocomplete dropdowns.
 */
export function suggestGrouped(
  query: string,
  opts: { limit?: number; mode?: 'prefix' | 'substring' | 'fuzzy' } = {},
): GroupedResult[] {
  const flat = suggest(query, opts);
  const map = new Map<string, GroupedResult>();
  for (const entry of flat) {
    if (!map.has(entry.base)) {
      map.set(entry.base, {
        base: entry.base,
        tones: baseIndex.get(entry.base)!.map((t, i) => ({
          tone: i + 1,
          syllableTone: t.syllableTone,
          fileUrl: t.fileUrl,
        })),
      });
    }
  }
  return [...map.values()];
}

// ── quiz helpers ───────────────────────────────────────────────────

/**
 * Get a specific entry by base + tone number.
 * Returns {base, tone, syllableTone, fileUrl} or null.
 */
export function getByBaseAndTone(base: string, tone: number): SyllableEntry | null {
  if (!isValidToneCombo(base, tone)) return null;
  const variant = baseIndex.get(base)![tone - 1];
  return { base, tone, syllableTone: variant.syllableTone, fileUrl: variant.fileUrl };
}

/**
 * Generate incorrect distractors for a given correct syllable.
 * Useful for building multiple-choice quiz options.
 */
export function getDistractors(
  correct: string,
  count = 3,
  opts: { sameBase?: boolean; sameTone?: boolean } = {},
): SyllableEntry[] {
  const entry = toneMarkedIndex.get(correct);
  if (!entry) return [];

  const { base, tone } = entry;
  const distractors: SyllableEntry[] = [];

  if (opts.sameBase) {
    const candidates = [1, 2, 3, 4].filter(t => t !== tone);
    for (const t of candidates) {
      if (distractors.length >= count) break;
      const d = getByBaseAndTone(base, t);
      if (d) distractors.push(d);
    }
  } else if (opts.sameTone) {
    const candidates = (toneIndex.get(tone) || [])
      .filter(e => e.base !== base)
      .sort(() => Math.random() - 0.5);
    for (const e of candidates) {
      if (distractors.length >= count) break;
      distractors.push(e);
    }
  } else {
    const all = [...toneMarkedIndex.values()]
      .filter(e => e.syllableTone !== correct)
      .sort(() => Math.random() - 0.5);
    for (const e of all) {
      if (distractors.length >= count) break;
      distractors.push(e);
    }
  }

  return distractors;
}
