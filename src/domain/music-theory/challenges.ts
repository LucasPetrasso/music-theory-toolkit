import { CHORD_FORMULAS } from '../../data/chords.ts'
import { buildChord } from './chords.ts'
import { circleOfFifths } from './circles.ts'
import { buildHarmonicField, relativeMinor } from './harmonic-field.ts'
import { intervalBetween } from './intervals.ts'
import { formatNote, pitchClass, spellPitch } from './notes.ts'
import type { ChordQualityId, KeySignature, SpelledNote } from './types.ts'

export type ChallengeKind =
  | 'major-third'
  | 'semitones'
  | 'harmonic-degree'
  | 'chord-notes'
  | 'relative-minor'
  | 'scale-triad'

export interface Challenge {
  prompt: string
  choices: string[]
  correctIndex: number
  answer: string
  explanation: string
}

export interface ChallengeOptions {
  tonic?: SpelledNote
  other?: SpelledNote
  degreeIndex?: number
  quality?: ChordQualityId
}

type Rng = () => number

const INTERVAL_COUNTS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']

const KINDS: readonly ChallengeKind[] = [
  'major-third',
  'semitones',
  'harmonic-degree',
  'chord-notes',
  'relative-minor',
  'scale-triad',
]

function majorKeys(): KeySignature[] {
  return circleOfFifths().map((key) => key.signature)
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)]
  if (item === undefined) {
    throw new Error('Não há itens para sortear.')
  }
  return item
}

function pickIndex(rng: Rng, length: number): number {
  return Math.floor(rng() * length)
}

function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex] as T
    copy[swapIndex] = current as T
  }
  return copy
}

function pickDistractors(rng: Rng, pool: readonly string[], answer: string): string[] {
  const available = [...new Set(pool.filter((item) => item !== answer))]
  const chosen: string[] = []
  while (chosen.length < 3 && available.length > 0) {
    const index = Math.floor(rng() * available.length)
    const [next] = available.splice(index, 1)
    if (next) chosen.push(next)
  }
  return chosen
}

function withChoices(rng: Rng, prompt: string, answer: string, explanation: string, pool: readonly string[]): Challenge {
  const choices = shuffle(rng, [answer, ...pickDistractors(rng, pool, answer)])
  return {
    prompt,
    answer,
    explanation,
    choices,
    correctIndex: choices.indexOf(answer),
  }
}

function resolveTonic(rng: Rng, tonic: SpelledNote | undefined): SpelledNote {
  return tonic ?? pick(rng, majorKeys()).tonic
}

export function createChallenge(kind: ChallengeKind, rng: Rng, options: ChallengeOptions = {}): Challenge {
  const tonic = resolveTonic(rng, options.tonic)

  if (kind === 'major-third') {
    const third = buildChord(tonic, 'major').tones[1]
    if (!third) throw new Error('A tríade maior não tem terça.')
    const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((value) =>
      formatNote(spellPitch(pitchClass(value), tonic.accidental < 0 ? 'flat' : 'sharp')),
    )
    return withChoices(
      rng,
      `Qual é a terça maior de ${formatNote(tonic)}?`,
      third.label,
      `A terça maior fica 4 semitons acima de ${formatNote(tonic)}. A nota é ${third.label}.`,
      pool,
    )
  }

  if (kind === 'semitones') {
    const other = options.other ?? pick(rng, majorKeys()).tonic
    const interval = intervalBetween(tonic, other)
    const pool = INTERVAL_COUNTS
    return withChoices(
      rng,
      `Quantos semitons existem no intervalo ascendente de ${formatNote(tonic)} até ${formatNote(other)}?`,
      String(interval.semitones),
      `Subindo de ${formatNote(tonic)} até ${formatNote(other)} há ${interval.semitones} semitons: ${interval.definition.name}.`,
      pool,
    )
  }

  if (kind === 'harmonic-degree') {
    const field = buildHarmonicField(tonic)
    const degreeIndex = options.degreeIndex ?? pickIndex(rng, field.degrees.length)
    const degree = field.degrees[degreeIndex]
    if (!degree) throw new Error('Grau harmônico inválido.')
    return withChoices(
      rng,
      `Qual é o ${degree.roman} grau do campo harmônico de ${formatNote(tonic)}?`,
      degree.symbol,
      `No campo de ${field.name}, o grau ${degree.roman} é ${degree.symbol} (${degree.noteLabels.join(' — ')}).`,
      field.degrees.map((item) => item.symbol),
    )
  }

  if (kind === 'chord-notes') {
    const quality = options.quality ?? pick(rng, CHORD_FORMULAS).id
    const chord = buildChord(tonic, quality)
    const answer = chord.tones.map((tone) => tone.label).join(' — ')
    const pool = CHORD_FORMULAS.map((formula) =>
      buildChord(tonic, formula.id).tones.map((tone) => tone.label).join(' — '),
    )
    return withChoices(
      rng,
      `Quais notas formam ${chord.name}?`,
      answer,
      `${chord.name} é formado por ${answer}.`,
      pool,
    )
  }

  if (kind === 'relative-minor') {
    const relative = relativeMinor(tonic)
    const pool = majorKeys().map((key) => relativeMinor(key.tonic).symbol)
    return withChoices(
      rng,
      `Qual é a relativa menor de ${formatNote(tonic)}?`,
      relative.symbol,
      `A relativa menor é o grau VI de ${formatNote(tonic)} maior: ${relative.symbol}.`,
      pool,
    )
  }

  const triad = buildChord(tonic, 'major')
  const answer = triad.name
  const pool = (['major', 'minor', 'diminished', 'augmented'] as const).map((quality) => buildChord(tonic, quality).name)
  return withChoices(
    rng,
    `Qual acorde é formado pelos graus 1, 3 e 5 de ${formatNote(tonic)}?`,
    answer,
    `Os graus 1, 3 e 5 de ${formatNote(tonic)} maior formam ${answer}: ${triad.tones.map((tone) => tone.label).join(' — ')}.`,
    pool,
  )
}

export function nextChallenge(rng: Rng): Challenge {
  return createChallenge(pick(rng, KINDS), rng)
}
