import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateProgressivePositionalNotationProblem } from '../../src/lib/positionalNotationProblems'

describe('generateProgressivePositionalNotationProblem', () => {
  afterEach(() => vi.restoreAllMocks())

  it('caps both crown levels at their documented maximum', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)

    expect(generateProgressivePositionalNotationProblem(9, 10)).toEqual({
      target: 120,
    })
    expect(
      generateProgressivePositionalNotationProblem(0, 1, 'two-crowns')
    ).toEqual({ target: 999 })
    expect(
      generateProgressivePositionalNotationProblem(9, 10, 'two-crowns')
    ).toEqual({ target: 999 })
  })
})
