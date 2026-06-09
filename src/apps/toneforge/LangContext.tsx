import { createContext, useContext, useState, useCallback } from 'react'
import { type Lang, type LocaleStrings, getLocale, LANGS, LANG_LABELS } from './locale.ts'

interface LangCtx {
  lang: Lang
  t: LocaleStrings
  setLang: (lang: Lang) => void
}

const LangContext = createContext<LangCtx>({
  lang: 'en',
  t: getLocale('en'),
  setLang: () => {},
})

export function useT() {
  return useContext(LangContext)
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem('toneforge-lang')
      if (stored && LANGS.includes(stored as Lang)) return stored as Lang
    } catch {}
    return 'en'
  })

  const handleSetLang = useCallback((l: Lang) => {
    setLang(l)
    try { localStorage.setItem('toneforge-lang', l) } catch {}
  }, [])

  return (
    <LangContext.Provider value={{ lang, t: getLocale(lang), setLang: handleSetLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function LangSwitcher() {
  const { lang, setLang } = useT()
  return (
    <div className="tf-lang-switcher">
      {LANGS.map((l) => (
        <button
          key={l}
          className={`tf-lang-btn${lang === l ? ' is-active' : ''}`}
          onClick={() => setLang(l)}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  )
}
