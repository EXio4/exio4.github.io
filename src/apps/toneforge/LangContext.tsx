import { useCallback, useState, type ReactNode } from 'react'
import { type Lang, getLocale, LANGS, LANG_LABELS } from './locale.ts'
import { LangContext, useT } from './LangContextCore.ts'

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readStoredLang)

  const handleSetLang = useCallback((l: Lang) => {
    setLang(l)
    saveStoredLang(l)
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

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem('toneforge-lang')
    if (stored && LANGS.includes(stored as Lang)) return stored as Lang
  } catch {
    return 'en'
  }
  return 'en'
}

function saveStoredLang(lang: Lang): void {
  try {
    localStorage.setItem('toneforge-lang', lang)
  } catch {
    return
  }
}
