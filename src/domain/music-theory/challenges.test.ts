import { describe, expect, it } from 'vitest'
import { createChallenge, nextChallenge } from './challenges.ts'
import { noteFromLetter } from './notes.ts'

describe('desafio', () => {
  it('marca o V grau de G como D', () => {
    const challenge = createChallenge('harmonic-degree', () => 0.2, {
      tonic: noteFromLetter('G'),
      degreeIndex: 4,
    })

    expect(challenge.answer).toBe('D')
    expect(challenge.choices[challenge.correctIndex]).toBe('D')
    expect(new Set(challenge.choices).size).toBe(4)
  })

  it('informa que a pergunta de semitons considera o intervalo ascendente', () => {
    const challenge = createChallenge('semitones', () => 0.2, {
      tonic: noteFromLetter('A'),
      other: noteFromLetter('F', 1),
    })

    expect(challenge.prompt).toContain('ascendente')
    expect(challenge.answer).toBe('9')
    expect(challenge.choices[challenge.correctIndex]).toBe('9')
  })

  it('mantém a alternativa correta alinhada ao domínio com um gerador fixo', () => {
    const challenge = nextChallenge(() => 0)
    expect(challenge.choices[challenge.correctIndex]).toBe(challenge.answer)
    expect(challenge.choices).toHaveLength(4)
    expect(challenge.explanation.length).toBeGreaterThan(0)
  })
})
