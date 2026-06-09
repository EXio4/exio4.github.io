import { useState } from 'react'
import './counter.css'

export default function CounterApp() {
  const [count, setCount] = useState(0)

  return (
    <div className="counter-app">
      <h1 className="counter-title">Counter</h1>
      <p className="counter-desc">
        A simple stateful counter demonstrating <code>useState</code>.
      </p>

      <div className="counter-display" aria-live="polite" aria-atomic="true">
        {count}
      </div>

      <div className="counter-controls">
        <button
          type="button"
          onClick={() => setCount((c) => c - 1)}
          aria-label="Decrement"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setCount(0)}
          aria-label="Reset"
          className="counter-reset"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          aria-label="Increment"
        >
          +
        </button>
      </div>
    </div>
  )
}
