import yi from 'hanzi-writer-data/一.json'
import er from 'hanzi-writer-data/二.json'
import san from 'hanzi-writer-data/三.json'
import si from 'hanzi-writer-data/四.json'
import wu from 'hanzi-writer-data/五.json'
import liu from 'hanzi-writer-data/六.json'
import qi from 'hanzi-writer-data/七.json'
import ba from 'hanzi-writer-data/八.json'
import jiu from 'hanzi-writer-data/九.json'
import shi from 'hanzi-writer-data/十.json'
import ren from 'hanzi-writer-data/人.json'
import kou from 'hanzi-writer-data/口.json'
import ri from 'hanzi-writer-data/日.json'
import yue from 'hanzi-writer-data/月.json'
import shui from 'hanzi-writer-data/水.json'
import huo from 'hanzi-writer-data/火.json'
import shan from 'hanzi-writer-data/山.json'
import mu from 'hanzi-writer-data/木.json'
import da from 'hanzi-writer-data/大.json'
import xiao from 'hanzi-writer-data/小.json'
import type { HanziWriterCharacterData } from './types.ts'

export const HANZI_DATA: Record<string, HanziWriterCharacterData> = {
  一: yi,
  二: er,
  三: san,
  四: si,
  五: wu,
  六: liu,
  七: qi,
  八: ba,
  九: jiu,
  十: shi,
  人: ren,
  口: kou,
  日: ri,
  月: yue,
  水: shui,
  火: huo,
  山: shan,
  木: mu,
  大: da,
  小: xiao,
}

export function getHanziData(character: string): HanziWriterCharacterData {
  const data = HANZI_DATA[character]
  if (!data) {
    throw new Error(`No local HanziWriter data for "${character}"`)
  }
  return data
}

export function getStrokeCount(character: string): number {
  return getHanziData(character).strokes.length
}
