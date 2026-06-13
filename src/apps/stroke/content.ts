import { getStrokeCount } from './hanziData.ts'
import type { StrokeCharacter, StrokeCourse, StrokeDeck } from './types.ts'

export const COURSES: StrokeCourse[] = [
  {
    id: 'essentials',
    name: 'Essentials',
    description: 'Starter characters for building confident stroke order habits.',
    deckIds: ['numbers', 'common'],
  },
]

export const DECKS: StrokeDeck[] = [
  {
    id: 'numbers',
    courseId: 'essentials',
    name: 'Numbers',
    description: 'The ten numeric characters that show core stroke directions.',
    characterIds: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
  },
  {
    id: 'common',
    courseId: 'essentials',
    name: 'Common',
    description: 'High-frequency building blocks for early reading and writing.',
    characterIds: ['人', '口', '日', '月', '水', '火', '山', '木', '大', '小'],
  },
]

const CHARACTER_DETAILS: Omit<StrokeCharacter, 'strokeCount'>[] = [
  {
    character: '一',
    deckIds: ['numbers'],
    pinyin: 'yi1',
    pinyinMarked: 'yī',
    meaning: 'one',
    radical: '一',
    example: '一个人 - one person',
  },
  {
    character: '二',
    deckIds: ['numbers'],
    pinyin: 'er4',
    pinyinMarked: 'èr',
    meaning: 'two',
    radical: '二',
    example: '二月 - February',
  },
  {
    character: '三',
    deckIds: ['numbers'],
    pinyin: 'san1',
    pinyinMarked: 'sān',
    meaning: 'three',
    radical: '一',
    example: '三天 - three days',
  },
  {
    character: '四',
    deckIds: ['numbers'],
    pinyin: 'si4',
    pinyinMarked: 'sì',
    meaning: 'four',
    radical: '囗',
    example: '四口人 - four people',
  },
  {
    character: '五',
    deckIds: ['numbers'],
    pinyin: 'wu3',
    pinyinMarked: 'wǔ',
    meaning: 'five',
    radical: '二',
    example: '五月 - May',
  },
  {
    character: '六',
    deckIds: ['numbers'],
    pinyin: 'liu4',
    pinyinMarked: 'liù',
    meaning: 'six',
    radical: '八',
    example: '六个 - six items',
  },
  {
    character: '七',
    deckIds: ['numbers'],
    pinyin: 'qi1',
    pinyinMarked: 'qī',
    meaning: 'seven',
    radical: '一',
    example: '七天 - seven days',
  },
  {
    character: '八',
    deckIds: ['numbers'],
    pinyin: 'ba1',
    pinyinMarked: 'bā',
    meaning: 'eight',
    radical: '八',
    example: '八月 - August',
  },
  {
    character: '九',
    deckIds: ['numbers'],
    pinyin: 'jiu3',
    pinyinMarked: 'jiǔ',
    meaning: 'nine',
    radical: '乙',
    example: '九点 - nine o’clock',
  },
  {
    character: '十',
    deckIds: ['numbers'],
    pinyin: 'shi2',
    pinyinMarked: 'shí',
    meaning: 'ten',
    radical: '十',
    example: '十月 - October',
  },
  {
    character: '人',
    deckIds: ['common'],
    pinyin: 'ren2',
    pinyinMarked: 'rén',
    meaning: 'person',
    radical: '人',
    example: '人们 - people',
  },
  {
    character: '口',
    deckIds: ['common'],
    pinyin: 'kou3',
    pinyinMarked: 'kǒu',
    meaning: 'mouth',
    radical: '口',
    example: '人口 - population',
  },
  {
    character: '日',
    deckIds: ['common'],
    pinyin: 'ri4',
    pinyinMarked: 'rì',
    meaning: 'sun; day',
    radical: '日',
    example: '日子 - days',
  },
  {
    character: '月',
    deckIds: ['common'],
    pinyin: 'yue4',
    pinyinMarked: 'yuè',
    meaning: 'moon; month',
    radical: '月',
    example: '月亮 - moon',
  },
  {
    character: '水',
    deckIds: ['common'],
    pinyin: 'shui3',
    pinyinMarked: 'shuǐ',
    meaning: 'water',
    radical: '水',
    example: '喝水 - drink water',
  },
  {
    character: '火',
    deckIds: ['common'],
    pinyin: 'huo3',
    pinyinMarked: 'huǒ',
    meaning: 'fire',
    radical: '火',
    example: '火山 - volcano',
  },
  {
    character: '山',
    deckIds: ['common'],
    pinyin: 'shan1',
    pinyinMarked: 'shān',
    meaning: 'mountain',
    radical: '山',
    example: '山水 - landscape',
  },
  {
    character: '木',
    deckIds: ['common'],
    pinyin: 'mu4',
    pinyinMarked: 'mù',
    meaning: 'wood; tree',
    radical: '木',
    example: '木头 - wood',
  },
  {
    character: '大',
    deckIds: ['common'],
    pinyin: 'da4',
    pinyinMarked: 'dà',
    meaning: 'big',
    radical: '大',
    example: '大学 - university',
  },
  {
    character: '小',
    deckIds: ['common'],
    pinyin: 'xiao3',
    pinyinMarked: 'xiǎo',
    meaning: 'small',
    radical: '小',
    example: '小心 - careful',
  },
]

export const CHARACTERS: StrokeCharacter[] = CHARACTER_DETAILS.map((entry) => ({
  ...entry,
  strokeCount: getStrokeCount(entry.character),
}))

export function getDeck(deckId: string): StrokeDeck | undefined {
  return DECKS.find((deck) => deck.id === deckId)
}

export function getCharacter(character: string): StrokeCharacter | undefined {
  return CHARACTERS.find((entry) => entry.character === character)
}

export function getDeckCharacters(deckId: string): StrokeCharacter[] {
  const deck = getDeck(deckId)
  if (!deck) return []
  return deck.characterIds
    .map((character) => getCharacter(character))
    .filter((entry): entry is StrokeCharacter => Boolean(entry))
}
