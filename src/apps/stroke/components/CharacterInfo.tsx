import type { StrokeCharacter } from '../types.ts'

interface Props {
  character: StrokeCharacter
}

export function CharacterInfo({ character }: Props) {
  const speak = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(character.character)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.82
    window.speechSynthesis.speak(utterance)
  }

  return (
    <aside className="stroke-character-info" aria-label="Character details">
      <div className="stroke-character-main">
        <span className="stroke-character-glyph">{character.character}</span>
        <div>
          <h2>{character.pinyinMarked}</h2>
          <p>{character.meaning}</p>
        </div>
      </div>

      <dl className="stroke-facts">
        <div>
          <dt>Radical</dt>
          <dd>{character.radical}</dd>
        </div>
        <div>
          <dt>Strokes</dt>
          <dd>{character.strokeCount}</dd>
        </div>
        <div>
          <dt>Example</dt>
          <dd>{character.example}</dd>
        </div>
      </dl>

      <button type="button" className="stroke-secondary-btn" onClick={speak}>
        Listen
      </button>
    </aside>
  )
}
