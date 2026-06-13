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
import wo from 'hanzi-writer-data/我.json'
import ni from 'hanzi-writer-data/你.json'
import nin from 'hanzi-writer-data/您.json'
import ta from 'hanzi-writer-data/他.json'
import tal from 'hanzi-writer-data/她.json'
import taz from 'hanzi-writer-data/它.json'
import men from 'hanzi-writer-data/们.json'
import zi from 'hanzi-writer-data/子.json'
import nv from 'hanzi-writer-data/女.json'
import ba_ba from 'hanzi-writer-data/爸.json'
import ma from 'hanzi-writer-data/妈.json'
import ge from 'hanzi-writer-data/哥.json'
import jie from 'hanzi-writer-data/姐.json'
import di_di from 'hanzi-writer-data/弟.json'
import mei from 'hanzi-writer-data/妹.json'
import ye from 'hanzi-writer-data/爷.json'
import nai from 'hanzi-writer-data/奶.json'
import bai from 'hanzi-writer-data/白.json'
import hei from 'hanzi-writer-data/黑.json'
import hong from 'hanzi-writer-data/红.json'
import huang from 'hanzi-writer-data/黄.json'
import lan from 'hanzi-writer-data/蓝.json'
import lv from 'hanzi-writer-data/绿.json'
import shang from 'hanzi-writer-data/上.json'
import xia from 'hanzi-writer-data/下.json'
import zuo from 'hanzi-writer-data/左.json'
import you from 'hanzi-writer-data/右.json'
import hen from 'hanzi-writer-data/很.json'
import ye_ye from 'hanzi-writer-data/也.json'
import dou from 'hanzi-writer-data/都.json'
import bu from 'hanzi-writer-data/不.json'
import ma_ma from 'hanzi-writer-data/吗.json'
import ne from 'hanzi-writer-data/呢.json'
import ba_pa from 'hanzi-writer-data/吧.json'
import chi from 'hanzi-writer-data/吃.json'
import he from 'hanzi-writer-data/喝.json'
import zou from 'hanzi-writer-data/走.json'
import zuoz from 'hanzi-writer-data/坐.json'
import kan from 'hanzi-writer-data/看.json'
import ting from 'hanzi-writer-data/听.json'
import shuo from 'hanzi-writer-data/说.json'
import xue from 'hanzi-writer-data/学.json'
import xie from 'hanzi-writer-data/写.json'
import li from 'hanzi-writer-data/立.json'
import mi from 'hanzi-writer-data/米.json'
import mian from 'hanzi-writer-data/面.json'
import cai from 'hanzi-writer-data/菜.json'
import guo from 'hanzi-writer-data/果.json'
import cha from 'hanzi-writer-data/茶.json'
import jiu_jiu from 'hanzi-writer-data/酒.json'
import rou from 'hanzi-writer-data/肉.json'
import dan from 'hanzi-writer-data/蛋.json'
import yu from 'hanzi-writer-data/鱼.json'
import niu from 'hanzi-writer-data/牛.json'
import tian from 'hanzi-writer-data/天.json'
import di from 'hanzi-writer-data/地.json'
import feng from 'hanzi-writer-data/风.json'
import yun from 'hanzi-writer-data/云.json'
import yuz from 'hanzi-writer-data/雨.json'
import hua from 'hanzi-writer-data/花.json'
import cao from 'hanzi-writer-data/草.json'
import tuz from 'hanzi-writer-data/土.json'
import shiz from 'hanzi-writer-data/石.json'
import jin from 'hanzi-writer-data/金.json'
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
  我: wo,
  你: ni,
  您: nin,
  他: ta,
  她: tal,
  它: taz,
  们: men,
  子: zi,
  女: nv,
  爸: ba_ba,
  妈: ma,
  哥: ge,
  姐: jie,
  弟: di_di,
  妹: mei,
  爷: ye,
  奶: nai,
  白: bai,
  黑: hei,
  红: hong,
  黄: huang,
  蓝: lan,
  绿: lv,
  上: shang,
  下: xia,
  左: zuo,
  右: you,
  很: hen,
  也: ye_ye,
  都: dou,
  不: bu,
  吗: ma_ma,
  呢: ne,
  吧: ba_pa,
  吃: chi,
  喝: he,
  走: zou,
  坐: zuoz,
  看: kan,
  听: ting,
  说: shuo,
  学: xue,
  写: xie,
  立: li,
  米: mi,
  面: mian,
  菜: cai,
  果: guo,
  茶: cha,
  酒: jiu_jiu,
  肉: rou,
  蛋: dan,
  鱼: yu,
  牛: niu,
  天: tian,
  地: di,
  风: feng,
  云: yun,
  雨: yuz,
  花: hua,
  草: cao,
  土: tuz,
  石: shiz,
  金: jin,
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
