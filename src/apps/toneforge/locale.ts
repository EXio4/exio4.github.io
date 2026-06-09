export type Lang = 'en' | 'es-AR';

export interface LocaleStrings {
  // SetupScreen
  setupTitle: string;
  setupDesc: string;
  rounds: string;
  difficulty: string;
  consonants: string;
  tones: string;
  startGame: string;

  // Tier cards
  tierEasy: string;
  tierEasyDesc: string;
  tierMedium: string;
  tierMediumDesc: string;
  tierHard: string;
  tierHardDesc: string;
  tierExpert: string;
  tierExpertDesc: string;

  // Consonant groups
  groupLabials: string;
  groupAlveolars: string;
  groupVelars: string;
  groupPalatals: string;
  groupRetroflex: string;
  groupDentals: string;

  // Tone chips
  tone1Name: string;
  tone1Full: string;
  tone2Name: string;
  tone2Full: string;
  tone3Name: string;
  tone3Full: string;
  tone4Name: string;
  tone4Full: string;

  // GameScreen
  round: string;
  playAudio: string;
  listen: string;
  replay: string;
  replayCount: string;
  expertPlaceholder: string;
  submit: string;
  correct: string;
  wrongAnswer: string;

  // ResultsScreen
  gameOver: string;
  correctCount: string;
  bestStreak: string;
  accuracyByTone: string;
  tone1Result: string;
  tone2Result: string;
  tone3Result: string;
  tone4Result: string;
  playAgain: string;
  practiceWeak: string;

  // Error messages (toneforge.ts)
  errInvalidSyllable: string;
  errNoToneEnabled: string;
  errEmptyGroups: string;
  errNotListening: string;
}

const en: LocaleStrings = {
  setupTitle: 'ToneForge',
  setupDesc: 'Train your ear for Mandarin tones. Listen to a syllable and identify which of the four tones you heard.',
  rounds: 'Rounds',
  difficulty: 'Difficulty',
  consonants: 'Consonants',
  tones: 'Tones',
  startGame: 'Start Game',

  tierEasy: 'Easy',
  tierEasyDesc: 'Same syllable, pick the tone',
  tierMedium: 'Medium',
  tierMediumDesc: 'Mixed syllables, 3 replays',
  tierHard: 'Hard',
  tierHardDesc: '6 options, 1 replay',
  tierExpert: 'Expert',
  tierExpertDesc: 'Type the answer, no hints',

  groupLabials: 'Labials',
  groupAlveolars: 'Alveolars',
  groupVelars: 'Velars',
  groupPalatals: 'Palatals',
  groupRetroflex: 'Retroflex',
  groupDentals: 'Dentals',

  tone1Name: '1st',
  tone1Full: 'High level',
  tone2Name: '2nd',
  tone2Full: 'Rising',
  tone3Name: '3rd',
  tone3Full: 'Dip-rise',
  tone4Name: '4th',
  tone4Full: 'Falling',

  round: 'Round',
  playAudio: 'Play audio',
  listen: 'Listen',
  replay: 'Replay',
  replayCount: 'Replay ({n})',
  expertPlaceholder: 'Type pinyin + tone, e.g. "ni3" or "nǐ"',
  submit: 'Submit',
  correct: 'Correct!',
  wrongAnswer: 'Wrong — the answer was {answer}',

  gameOver: 'Game Over',
  correctCount: '{correct} / {total} correct',
  bestStreak: 'Best streak:',
  accuracyByTone: 'Accuracy by tone',
  tone1Result: '1st (level)',
  tone2Result: '2nd (rising)',
  tone3Result: '3rd (dip)',
  tone4Result: '4th (falling)',
  playAgain: 'Play Again',
  practiceWeak: 'Practice Weak Spots',

  errInvalidSyllable: 'Invalid target syllable: "{syl}"',
  errNoToneEnabled: 'At least one tone must be enabled',
  errEmptyGroups: 'initialGroups must not be empty if provided',
  errNotListening: 'Not in listening phase',
};

const esAR: LocaleStrings = {
  setupTitle: 'ToneForge',
  setupDesc: 'Entrená tu oído para los tonos del mandarín. Escuchá una sílaba e identificá cuál de los cuatro tonos oíste.',
  rounds: 'Rondas',
  difficulty: 'Dificultad',
  consonants: 'Consonantes',
  tones: 'Tonos',
  startGame: 'Empezar',

  tierEasy: 'Fácil',
  tierEasyDesc: 'Misma sílaba, elegí el tono',
  tierMedium: 'Medio',
  tierMediumDesc: 'Sílabas variadas, 3 repeticiones',
  tierHard: 'Difícil',
  tierHardDesc: '6 opciones, 1 repetición',
  tierExpert: 'Experto',
  tierExpertDesc: 'Escribí la respuesta, sin pistas',

  groupLabials: 'Labiales',
  groupAlveolars: 'Alveolares',
  groupVelars: 'Velares',
  groupPalatals: 'Palatales',
  groupRetroflex: 'Retroflejas',
  groupDentals: 'Dentales',

  tone1Name: '1°',
  tone1Full: 'Alto sostenido',
  tone2Name: '2°',
  tone2Full: 'Ascendente',
  tone3Name: '3°',
  tone3Full: 'Desciende y sube',
  tone4Name: '4°',
  tone4Full: 'Descendente',

  round: 'Ronda',
  playAudio: 'Reproducir audio',
  listen: 'Escuchá',
  replay: 'Repetir',
  replayCount: 'Repetir ({n})',
  expertPlaceholder: 'Escribí pinyin + tono, ej. "ni3" o "nǐ"',
  submit: 'Enviar',
  correct: '¡Correcto!',
  wrongAnswer: 'Mal — la respuesta era {answer}',

  gameOver: 'Fin del juego',
  correctCount: '{correct} / {total} correctas',
  bestStreak: 'Mejor racha:',
  accuracyByTone: 'Precisión por tono',
  tone1Result: '1° (sostenido)',
  tone2Result: '2° (ascendente)',
  tone3Result: '3° (baja y sube)',
  tone4Result: '4° (descendente)',
  playAgain: 'Jugar de nuevo',
  practiceWeak: 'Practicar débiles',

  errInvalidSyllable: 'Sílaba inválida: "{syl}"',
  errNoToneEnabled: 'Al menos un tono debe estar habilitado',
  errEmptyGroups: 'initialGroups no puede estar vacío',
  errNotListening: 'No está en fase de escucha',
};

const locales: Record<Lang, LocaleStrings> = { en, 'es-AR': esAR };

export function getLocale(lang: Lang): LocaleStrings {
  return locales[lang] ?? locales.en;
}

export const LANG_LABELS: Record<Lang, string> = {
  en: 'EN',
  'es-AR': '🇦🇷 ES',
};

export const LANGS: Lang[] = ['en', 'es-AR'];
