import { describe, expect, it } from 'vitest'
import {
  CHARACTERS,
  COURSES,
  DECKS,
  getCharacter,
  getDeck,
  getDeckCharacters,
} from './content.ts'
import { getHanziData, getStrokeCount } from './hanziData.ts'

describe('Stroke content', () => {
  it('ships three courses with nine decks', () => {
    expect(COURSES).toHaveLength(3)
    expect(COURSES[0]).toMatchObject({ id: 'essentials', name: 'Essentials' })
    expect(COURSES[1]).toMatchObject({ id: 'foundations', name: 'Foundations' })
    expect(COURSES[2]).toMatchObject({ id: 'daily-life', name: 'Daily Life' })

    expect(DECKS.map((deck) => deck.id)).toEqual([
      'numbers',
      'common',
      'pronouns',
      'family',
      'colors-directions',
      'adverbs',
      'action-verbs',
      'food-drink',
      'nature-weather',
    ])
    expect(getDeckCharacters('numbers').map((entry) => entry.character)).toEqual([
      '一',
      '二',
      '三',
      '四',
      '五',
      '六',
      '七',
      '八',
      '九',
      '十',
    ])
    expect(getDeckCharacters('common').map((entry) => entry.character)).toEqual([
      '人',
      '口',
      '日',
      '月',
      '水',
      '火',
      '山',
      '木',
      '大',
      '小',
    ])
  })

  it('keeps every character unique and connected to local HanziWriter data', () => {
    const unique = new Set(CHARACTERS.map((entry) => entry.character))

    expect(CHARACTERS).toHaveLength(84)
    expect(unique.size).toBe(84)

    for (const entry of CHARACTERS) {
      const data = getHanziData(entry.character)

      expect(data.strokes.length).toBeGreaterThan(0)
      expect(getStrokeCount(entry.character)).toBe(data.strokes.length)
      expect(entry.strokeCount).toBe(data.strokes.length)
    }
  })

  it('looks up decks and characters by stable ids', () => {
    expect(getDeck('numbers')).toMatchObject({ name: 'Numbers' })
    expect(getDeck('missing')).toBeUndefined()
    expect(getCharacter('水')).toMatchObject({
      pinyin: 'shui3',
      pinyinMarked: 'shuǐ',
      meaning: 'water',
    })
    expect(getCharacter('Z')).toBeUndefined()
  })
})
