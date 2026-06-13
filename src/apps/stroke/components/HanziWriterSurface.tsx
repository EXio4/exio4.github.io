import HanziWriter from 'hanzi-writer'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { getHanziData } from '../hanziData.ts'
import type { StrokeAttemptEvent, StrokeInputType } from '../types.ts'

export interface HanziWriterSurfaceHandle {
  animate: () => void
  hint: () => void
}

interface Props {
  character: string
  attemptKey: number
  leniency: number
  onCanvasSizeChange: (size: number) => void
  onComplete: (summary: { character: string; totalMistakes: number }) => void
  onInputTypeChange: (inputType: StrokeInputType) => void
  onStrokeEvent: (event: StrokeAttemptEvent) => void
}

type HanziWriterInstance = ReturnType<typeof HanziWriter.create>

export const HanziWriterSurface = forwardRef<HanziWriterSurfaceHandle, Props>(
  (
    {
      character,
      attemptKey,
      leniency,
      onCanvasSizeChange,
      onComplete,
      onInputTypeChange,
      onStrokeEvent,
    },
    ref,
  ) => {
    const hostRef = useRef<HTMLDivElement>(null)
    const writerRef = useRef<HanziWriterInstance | null>(null)
    const currentStrokeRef = useRef(0)

    const startQuiz = useCallback(
      (writer: HanziWriterInstance) => {
        void writer.quiz({
          leniency,
          showHintAfterMisses: false,
          highlightOnComplete: false,
          onMistake: (strokeData) => {
            currentStrokeRef.current = strokeData.strokeNum
            onStrokeEvent({
              type: 'mistake',
              strokeNum: strokeData.strokeNum,
              mistakesOnStroke: strokeData.mistakesOnStroke,
              totalMistakes: strokeData.totalMistakes,
              strokesRemaining: strokeData.strokesRemaining,
              isBackwards: strokeData.isBackwards,
              drawnPath: strokeData.drawnPath,
            })
          },
          onCorrectStroke: (strokeData) => {
            currentStrokeRef.current = strokeData.strokeNum + 1
            onStrokeEvent({
              type: 'correct',
              strokeNum: strokeData.strokeNum,
              mistakesOnStroke: strokeData.mistakesOnStroke,
              totalMistakes: strokeData.totalMistakes,
              strokesRemaining: strokeData.strokesRemaining,
              isBackwards: strokeData.isBackwards,
              drawnPath: strokeData.drawnPath,
            })
          },
          onComplete,
        })
      },
      [leniency, onComplete, onStrokeEvent],
    )

    useImperativeHandle(ref, () => ({
      animate: () => {
        const writer = writerRef.current
        if (!writer) return
        writer.cancelQuiz()
        void writer.animateCharacter({
          onComplete: () => startQuiz(writer),
        })
      },
      hint: () => {
        const writer = writerRef.current
        if (!writer) return
        void writer.highlightStroke(currentStrokeRef.current)
      },
    }))

    useEffect(() => {
      const host = hostRef.current
      if (!host) return

      let disposed = false
      const size = getHostSize(host)
      const padding = getWriterPadding(size)

      host.replaceChildren()
      currentStrokeRef.current = 0
      onCanvasSizeChange(size)

      const writer = HanziWriter.create(host, character, {
        width: size,
        height: size,
        padding,
        showCharacter: false,
        showOutline: true,
        showHintAfterMisses: false,
        highlightOnComplete: false,
        drawingWidth: Math.max(8, Math.round(size * 0.022)),
        strokeAnimationSpeed: 1.25,
        delayBetweenStrokes: 250,
        strokeColor: '#1f2937',
        outlineColor: '#b7bdc8',
        drawingColor: '#16a34a',
        highlightColor: '#f59e0b',
        charDataLoader: (requestedCharacter) => getHanziData(requestedCharacter),
        onLoadCharDataError: (error) => {
          console.error('Unable to load Stroke character data', error)
        },
      })

      writerRef.current = writer
      startQuiz(writer)

      const resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry || disposed) return
        const nextSize = Math.round(entry.contentRect.width)
        if (nextSize <= 0) return

        onCanvasSizeChange(nextSize)
        writer.updateDimensions({
          width: nextSize,
          height: nextSize,
          padding: getWriterPadding(nextSize),
        })
      })
      resizeObserver.observe(host)

      return () => {
        disposed = true
        resizeObserver.disconnect()
        writer.cancelQuiz()
        writerRef.current = null
        host.replaceChildren()
      }
    }, [
      attemptKey,
      character,
      leniency,
      onCanvasSizeChange,
      onComplete,
      startQuiz,
      onStrokeEvent,
    ])

    const handlePointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'pen' || event.pointerType === 'touch' || event.pointerType === 'mouse') {
        onInputTypeChange(event.pointerType)
      }
    }

    return (
      <div className="stroke-writer-shell" onPointerDownCapture={handlePointerDownCapture}>
        <div className="stroke-grid" aria-hidden="true">
          <span className="stroke-grid-line is-vertical" />
          <span className="stroke-grid-line is-horizontal" />
          <span className="stroke-grid-line is-diagonal-a" />
          <span className="stroke-grid-line is-diagonal-b" />
        </div>
        <div
          ref={hostRef}
          className="stroke-writer-target"
          aria-label={`Trace ${character}`}
        />
      </div>
    )
  },
)

function getHostSize(host: HTMLElement): number {
  return Math.max(280, Math.round(host.getBoundingClientRect().width || 360))
}

function getWriterPadding(size: number): number {
  return Math.max(22, Math.round(size * 0.08))
}
