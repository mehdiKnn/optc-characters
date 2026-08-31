import { describe, expect, it } from 'vitest'
import { conditionSectionLabel, conditionSummary } from './conditionPresentation'
import type { CompositionCondition } from './types'

const condition = (overrides: Partial<CompositionCondition>): CompositionCondition => ({
  family: 'threshold', section: 'captain', count: 4, comparator: 'more', targets: [{ kind: 'type', value: 'DEX' }], original: 'Long text', checkable: true, ...overrides,
})

describe('présentation compacte des conditions', () => {
  it('résume les familles structurées et les sections techniques', () => {
    expect(conditionSummary(condition({}))).toBe('4+ DEX')
    expect(conditionSummary(condition({ family: 'roster', section: 'special', count: 2, targets: [{ kind: 'name', value: 'Roger' }, { kind: 'tag', value: 'Giant' }, { kind: 'tag', value: 'Straw Hat Pirates' }, { kind: 'tag', value: 'Navy' }]}))).toBe('2 parmi Roger · Giant · Straw Hat Pirates +1')
    expect(conditionSummary(condition({ family: 'raw', comparator: 'info', targets: [], checkable: false }))).toBe('Effet informatif')
    expect(conditionSectionLabel('potential.1.description.4')).toBe('Potentiel')
  })

  it('conserve la source quand les données structurées sont incomplètes', () => {
    expect(conditionSummary(condition({ targets: [], original: 'If your crew has 5 or more Slashers' }))).toBe('If your crew has 5 or more Slashers')
  })

  it('affiche le seuil alternatif des rosters', () => {
    expect(conditionSummary(condition({ family: 'roster', count: 3, alternateCount: 6, targets: [{ kind: 'tag', value: 'Navy' }]}))).toBe('3 ou 6 parmi Navy')
  })
})
