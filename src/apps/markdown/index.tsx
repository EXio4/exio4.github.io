import { useState, useMemo } from 'react'
import { marked } from 'marked'
import './markdown.css'

const DEFAULT_CONTENT = `# Markdown Preview

Write **Markdown** on the left, see the rendered output on the right.

## Features

- \`marked\` library for parsing
- Real-time preview
- Supports _most_ CommonMark syntax

## Code example

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`
}
\`\`\`

> Blockquotes work too.

---

Made with React + Vite + TypeScript.
`

export default function MarkdownApp() {
  const [source, setSource] = useState(DEFAULT_CONTENT)

  const html = useMemo(() => marked(source, { async: false }) as string, [source])

  return (
    <div className="md-app">
      <h1 className="md-title">Markdown Preview</h1>

      <div className="md-panes">
        <div className="md-pane">
          <div className="md-pane-label">Source</div>
          <textarea
            className="md-editor"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            aria-label="Markdown source"
          />
        </div>

        <div className="md-pane">
          <div className="md-pane-label">Preview</div>
          <div
            className="md-preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}
