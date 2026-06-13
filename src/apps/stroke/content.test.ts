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
  it('ships the V1 essentials course with two ten-character decks', () => {
    expect(COURSES).toHaveLength(1)
    expect(COURSES[0]).toMatchObject({ id: 'essentials', name: 'Essentials' })

    expect(DECKS.map((deck) => deck.id)).toEqual(['numbers', 'common'])
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

  it('keeps every V1 character unique and connected to local HanziWriter data', () => {
    const unique = new Set(CHARACTERS.map((entry) => entry.character))

    expect(CHARACTERS).toHaveLength(20)
    expect(unique.size).toBe(20)

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
