import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { signatureLabel, stepIndex } from '../../domain/music-theory/circles.ts'
import { formatNote } from '../../domain/music-theory/notes.ts'
import type { CircleKey } from '../../domain/music-theory/types.ts'

interface CircleDiagramProps {
  keys: readonly CircleKey[]
  selectedIndex: number
  label: string
  centerLabel: string
  onSelect: (index: number) => void
}

function point(index: number, total: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  }
}

export function CircleDiagram({ keys, selectedIndex, label, centerLabel, onSelect }: CircleDiagramProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const radius = 34

  function move(index: number, direction: 1 | -1) {
    const next = stepIndex(index, direction, keys.length)
    onSelect(next)
    buttons.current[next]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      move(index, 1)
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(index, -1)
    }
  }

  return (
    <div className="circle-stage">
      <svg className="circle-svg" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} />
        {keys.map((_, index) => {
          const start = point(index, keys.length, radius)
          const end = point((index + 1) % keys.length, keys.length, radius)
          return <line key={keys[index]?.signature.id ?? index} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
        })}
      </svg>
      <p className="circle-center" aria-hidden="true">
        {centerLabel}
      </p>
      <ul className="circle-keys" aria-label={label}>
        {keys.map((key, index) => {
          const position = point(index, keys.length, radius)
          const selected = index === selectedIndex
          return (
            <li key={key.signature.id} style={{ left: `${position.x}%`, top: `${position.y}%` }}>
              <button
                type="button"
                ref={(node) => {
                  buttons.current[index] = node
                }}
                className={`${selected ? 'is-selected' : ''}${key.alternate ? ' is-enharmonic' : ''}`}
                aria-pressed={selected}
                aria-label={
                  key.alternate
                    ? `${key.label}, 6 sustenidos ou 6 bemóis`
                    : `${formatNote(key.signature.tonic)} maior, ${signatureLabel(key.signature)}`
                }
                tabIndex={selected ? 0 : -1}
                onClick={() => onSelect(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                {key.alternate ? key.label.replace('/', '/\n') : key.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
