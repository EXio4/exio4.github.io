import './toneforge.css'

export default function ToneForgeApp() {
  return (
    <div className="tf-app">
      <h1 className="tf-title">ToneForge</h1>
      <p className="tf-desc">
        A Mandarin Chinese tone training tool. Practice distinguishing and producing
        the four tones plus the neutral tone.
      </p>

      <div className="tf-placeholder">
        <span className="tf-placeholder-emoji">🎵</span>
        <p className="tf-placeholder-text">
          Tone training exercises coming soon.
        </p>
      </div>

      <div className="tf-tone-grid">
        {[
          { tone: '1st', name: 'High Level', mark: 'ˉ', pinyin: 'mā', char: '妈' },
          { tone: '2nd', name: 'Rising', mark: 'ˊ', pinyin: 'má', char: '麻' },
          { tone: '3rd', name: 'Dip-Rise', mark: 'ˇ', pinyin: 'mǎ', char: '马' },
          { tone: '4th', name: 'Falling', mark: 'ˋ', pinyin: 'mà', char: '骂' },
          { tone: '5th', name: 'Neutral', mark: '·', pinyin: 'ma', char: '吗' },
        ].map((t) => (
          <div key={t.tone} className="tf-tone-card">
            <div className="tf-tone-mark">{t.mark}</div>
            <div className="tf-tone-name">{t.name}</div>
            <div className="tf-tone-pinyin">{t.pinyin}</div>
            <div className="tf-tone-char">{t.char}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
