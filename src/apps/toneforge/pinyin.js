import data from './pinyin.json';

// ── tone detection ──────────────────────────────────────────────────
const TONE_MARK_TO_NUMBER = {
  ā: 1, á: 2, ǎ: 3, à: 4,
  ē: 1, é: 2, ě: 3, è: 4,
  ī: 1, í: 2, ǐ: 3, ì: 4,
  ō: 1, ó: 2, ǒ: 3, ò: 4,
  ū: 1, ú: 2, ǔ: 3, ù: 4,
  ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4,
};

const TONE_NUMBER_TO_MARK = {
  a: { 1: 'ā', 2: 'á', 3: 'ǎ', 4: 'à' },
  e: { 1: 'ē', 2: 'é', 3: 'ě', 4: 'è' },
  i: { 1: 'ī', 2: 'í', 3: 'ǐ', 4: 'ì' },
  o: { 1: 'ō', 2: 'ó', 3: 'ǒ', 4: 'ò' },
  u: { 1: 'ū', 2: 'ú', 3: 'ǔ', 4: 'ù' },
  ü: { 1: 'ǖ', 2: 'ǘ', 3: 'ǚ', 4: 'ǜ' },
};

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'ü']);

function extractToneNumber(syllableTone) {
  for (const ch of syllableTone) {
    if (TONE_MARK_TO_NUMBER[ch]) return TONE_MARK_TO_NUMBER[ch];
  }
  return 0;
}

// ── indexes ──────────────────────────────────────────────────────────
const baseIndex = new Map();
const toneMarkedIndex = new Map();
const toneIndex = new Map();
const allBases = [];

for (const [base, tones] of data) {
  baseIndex.set(base, tones);
  allBases.push(base);
  for (const t of tones) {
    const toneNum = extractToneNumber(t.syllableTone);
    const entry = { base, tone: toneNum, syllableTone: t.syllableTone, fileUrl: t.fileUrl };
    toneMarkedIndex.set(t.syllableTone, entry);

    if (!toneIndex.has(toneNum)) toneIndex.set(toneNum, []);
    toneIndex.get(toneNum).push(entry);
  }
}

// ── validation ─────────────────────────────────────────────────────

/** Check if a base syllable (e.g. "ni") exists in the chart. */
function isValidBase(base) {
  return baseIndex.has(base);
}

/** Check if a tone-marked syllable (e.g. "nǐ") exists in the chart. */
function isValidSyllable(syllableTone) {
  return toneMarkedIndex.has(syllableTone);
}

/** Check if a base + tone number combination is valid. */
function isValidToneCombo(base, tone) {
  const tones = baseIndex.get(base);
  if (!tones) return false;
  return tone >= 1 && tone <= 4 && !!tones[tone - 1];
}

// ── lookup ─────────────────────────────────────────────────────────

/** Get all 4 tone variants for a base syllable. */
function getToneVariants(base) {
  return baseIndex.get(base) || null;
}

/** Get the audio URL for a base syllable + tone number. */
function getToneUrl(base, tone) {
  const tones = baseIndex.get(base);
  if (!tones || tone < 1 || tone > 4) return null;
  return tones[tone - 1].fileUrl;
}

/** Get the tone-marked form (e.g. "ni" + 3 → "nǐ"). */
function getSyllableTone(base, tone) {
  const tones = baseIndex.get(base);
  if (!tones || tone < 1 || tone > 4) return null;
  return tones[tone - 1].syllableTone;
}

/** Get the audio URL for a tone-marked syllable (e.g. "nǐ"). */
function getUrlFromToneMarked(syllableTone) {
  const entry = toneMarkedIndex.get(syllableTone);
  return entry ? entry.fileUrl : null;
}

// ── suggestion / autocomplete ──────────────────────────────────────

/**
 * Suggest syllables matching a query string.
 * Matches against base syllable and tone-marked forms.
 * @param {string} query - can be bare ("ni"), tone-marked ("nǐ"), or
 *   number-format ("ni3"). Case-insensitive.
 * @param {object} [opts]
 * @param {number} [opts.limit=20] - max results
 * @param {'prefix'|'substring'|'fuzzy'} [opts.mode='prefix'] - match mode
 * @returns {Array<{base, syllableTone, tone, fileUrl}>}
 */
function suggest(query, opts = {}) {
  const { limit = 20, mode = 'prefix' } = opts;
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // tone-marked exact match → always return immediately
  if (toneMarkedIndex.has(q)) return [toneMarkedIndex.get(q)];

  // number-format "ni3" → return immediately
  const numMatch = q.match(/^([a-zü]+)([1-4])$/);
  if (numMatch) {
    const base = numMatch[1];
    const tone = parseInt(numMatch[2]);
    if (baseIndex.has(base)) {
      const variant = baseIndex.get(base)[tone - 1];
      return [{ base, tone, syllableTone: variant.syllableTone, fileUrl: variant.fileUrl }];
    }
  }

  // exact base match in prefix mode → return 4 tones immediately
  if (mode === 'prefix' && baseIndex.has(q)) {
    return baseIndex.get(q).map((t, i) => ({
      base: q, tone: i + 1, syllableTone: t.syllableTone, fileUrl: t.fileUrl,
    }));
  }

  // prefix / substring / fuzzy search
  const results = [];
  const seen = new Set();

  const add = (entry) => {
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
      const tones = baseIndex.get(base);
      for (let i = 0; i < tones.length && results.length < limit; i++) {
        add({ base, tone: i + 1, syllableTone: tones[i].syllableTone, fileUrl: tones[i].fileUrl });
      }
    }
  }

  return results;
}

function fuzzyMatch(str, query) {
  let qi = 0;
  for (let si = 0; si < str.length && qi < query.length; si++) {
    if (str[si] === query[qi]) qi++;
  }
  return qi === query.length;
}

// ── search by category ─────────────────────────────────────────────

/** Get all syllables for a given tone number (1-4). */
function searchByTone(tone) {
  return toneIndex.get(tone) || [];
}

/** Get all syllables starting with a given initial consonant. */
function searchByInitial(initial) {
  const results = [];
  for (const base of allBases) {
    if (base.startsWith(initial)) {
      const tones = baseIndex.get(base);
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
function searchByFinal(final) {
  const results = [];
  for (const base of allBases) {
    if (base.endsWith(final) && base !== final) {
      const tones = baseIndex.get(base);
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
function normalize(input) {
  if (typeof input === 'object' && input !== null) {
    if (input.base && typeof input.tone === 'number') {
      return { base: input.base.toLowerCase(), tone: input.tone };
    }
    return null;
  }
  if (typeof input !== 'string') return null;

  let s = input.trim().toLowerCase();

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
function stripTone(syllableTone) {
  let base = '';
  for (const ch of syllableTone) {
    base += TONE_MARK_TO_NUMBER[ch] ? (
      ch === 'ǖ' || ch === 'ǘ' || ch === 'ǚ' || ch === 'ǜ' ? 'ü' :
      ch.normalize('NFD')[0]
    ) : ch;
  }
  return base;
}

// ── format conversion ──────────────────────────────────────────────

/** Convert tone-marked "nǐ" → number format "ni3". */
function toNumberFormat(syllableTone) {
  const tone = extractToneNumber(syllableTone);
  if (!tone) return syllableTone;
  return stripTone(syllableTone) + tone;
}

/** Convert base + tone → tone-marked form. "ni" + 3 → "nǐ". */
function toMarkFormat(base, tone) {
  return getSyllableTone(base, tone);
}

// ── data access ────────────────────────────────────────────────────

/** Get all valid base syllables (sorted). */
function getAllBases() {
  return [...allBases];
}

/** Get all valid tone-marked syllables. */
function getAllSyllableTones() {
  return [...toneMarkedIndex.keys()];
}

/** Get a random {base, tone, syllableTone, fileUrl} entry. */
function getRandom() {
  const base = allBases[Math.floor(Math.random() * allBases.length)];
  const tone = Math.floor(Math.random() * 4) + 1;
  const variant = baseIndex.get(base)[tone - 1];
  return { base, tone, syllableTone: variant.syllableTone, fileUrl: variant.fileUrl };
}

/** Get a random entry for a specific tone (1-4). */
function getRandomByTone(tone) {
  const entries = toneIndex.get(tone);
  if (!entries || entries.length === 0) return null;
  return entries[Math.floor(Math.random() * entries.length)];
}

/** Get total count of base syllables. */
function getBaseCount() {
  return allBases.length;
}

/** Get total count of tone-marked syllables. */
function getSyllableToneCount() {
  return toneMarkedIndex.size;
}

// ── suggestion (grouped) ───────────────────────────────────────────

/**
 * Like `suggest` but groups results by base (one entry per base
 * with all 4 tones), for cleaner autocomplete dropdowns.
 */
function suggestGrouped(query, opts = {}) {
  const flat = suggest(query, opts);
  const map = new Map();
  for (const entry of flat) {
    if (!map.has(entry.base)) {
      map.set(entry.base, {
        base: entry.base,
        tones: baseIndex.get(entry.base).map((t, i) => ({
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
function getByBaseAndTone(base, tone) {
  if (!isValidToneCombo(base, tone)) return null;
  const variant = baseIndex.get(base)[tone - 1];
  return { base, tone, syllableTone: variant.syllableTone, fileUrl: variant.fileUrl };
}

/**
 * Generate incorrect distractors for a given correct syllable.
 * Useful for building multiple-choice quiz options.
 * @param {string} correct - tone-marked syllable like "nǐ"
 * @param {number} [count=3] - number of distractors
 * @param {object} [opts]
 * @param {boolean} [opts.sameBase=false] - distractors share the same base, different tones
 * @param {boolean} [opts.sameTone=false] - distractors share the same tone, different bases
 * @returns {Array<{base, tone, syllableTone, fileUrl}>}
 */
function getDistractors(correct, count = 3, opts = {}) {
  const entry = toneMarkedIndex.get(correct);
  if (!entry) return [];

  const { base, tone } = entry;
  const distractors = [];

  if (opts.sameBase) {
    // different tones of the same base
    const candidates = [1, 2, 3, 4].filter(t => t !== tone);
    for (const t of candidates) {
      if (distractors.length >= count) break;
      distractors.push(getByBaseAndTone(base, t));
    }
  } else if (opts.sameTone) {
    // same tone, different bases
    const candidates = toneIndex.get(tone)
      .filter(e => e.base !== base)
      .sort(() => Math.random() - 0.5);
    for (const e of candidates) {
      if (distractors.length >= count) break;
      distractors.push(e);
    }
  } else {
    // totally random
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

// ── exports ────────────────────────────────────────────────────────

export {
  // validation
  isValidBase,
  isValidSyllable,
  isValidToneCombo,

  // lookup
  getToneVariants,
  getToneUrl,
  getSyllableTone,
  getUrlFromToneMarked,

  // suggestion
  suggest,

  // search
  searchByTone,
  searchByInitial,
  searchByFinal,

  // normalization
  normalize,
  stripTone,

  // format conversion
  toNumberFormat,
  toMarkFormat,

  // suggestion (grouped)
  suggestGrouped,

  // quiz helpers
  getByBaseAndTone,
  getDistractors,

  // data access
  getAllBases,
  getAllSyllableTones,
  getRandom,
  getRandomByTone,
  getBaseCount,
  getSyllableToneCount,
};
