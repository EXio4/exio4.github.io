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

// validation
export function isValidBase(base: string): boolean;
export function isValidSyllable(syllableTone: string): boolean;
export function isValidToneCombo(base: string, tone: number): boolean;

// lookup
export function getToneVariants(base: string): SyllableVariant[] | null;
export function getToneUrl(base: string, tone: number): string | null;
export function getSyllableTone(base: string, tone: number): string | null;
export function getUrlFromToneMarked(syllableTone: string): string | null;

// suggestion
export function suggest(
  query: string,
  opts?: { limit?: number; mode?: 'prefix' | 'substring' | 'fuzzy' },
): SyllableEntry[];

// search
export function searchByTone(tone: number): SyllableEntry[];
export function searchByInitial(initial: string): SyllableEntry[];
export function searchByFinal(final: string): SyllableEntry[];

// normalization
export function normalize(
  input: string | { base: string; tone: number },
): { base: string; tone: number } | null;
export function stripTone(syllableTone: string): string;

// format conversion
export function toNumberFormat(syllableTone: string): string;
export function toMarkFormat(base: string, tone: number): string | null;

// suggestion (grouped)
export function suggestGrouped(
  query: string,
  opts?: { limit?: number; mode?: 'prefix' | 'substring' | 'fuzzy' },
): GroupedResult[];

// quiz helpers
export function getByBaseAndTone(base: string, tone: number): SyllableEntry | null;
export function getDistractors(
  correct: string,
  count?: number,
  opts?: { sameBase?: boolean; sameTone?: boolean },
): SyllableEntry[];

// data access
export function getAllBases(): string[];
export function getAllSyllableTones(): string[];
export function getRandom(): SyllableEntry;
export function getRandomByTone(tone: number): SyllableEntry | null;
export function getBaseCount(): number;
export function getSyllableToneCount(): number;
