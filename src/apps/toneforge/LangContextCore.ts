import { createContext, useContext } from 'react'
import { type Lang, type LocaleStrings, getLocale } from './locale.ts'

interface LangCtx {
  lang: Lang
  t: LocaleStrings
  setLang: (lang: Lang) => void
}

export const LangContext = createContext<LangCtx>({
  lang: 'en',
  t: getLocale('en'),
  setLang: () => undefined,
})

export function useT() {
  return useContext(LangContext)
}
