import { describe, expect, it } from 'vitest'
import { candidateProgress, conditionState, hasFamilyConflict, supportVerdict, teamCost } from './engine'
import type { CompositionCondition, Unit } from './types'

const unit = (id: string, overrides: Partial<Unit> = {}): Unit => ({
  id, name: `Unit ${id}`, types: ['STR'], classes: ['Fighter'], stars: '5', cost: 20, combo: 4,
  families: [`Family ${id}`], tags: ['Navy'], flags: [], conditions: [], ...overrides,
})

describe('moteur public de composition', () => {
  it('exclut le friend captain du coût PVE et inclut les supports', () => {
    const units = { a: unit('a'), b: unit('b', { cost: 50 }), s: unit('s', { cost: 7 }) }
    expect(teamCost({ type: 'pve', slots: ['a', 'b', null, null, null, null], supports: { 0: 's' } }, units)).toBe(27)
  })

  it('détecte un doublon dès qu’une famille est partagée', () => {
    expect(hasFamilyConflict(unit('a', { families: ['Luffy'] }), [unit('b', { families: ['Luffy', 'Gear 5'] })])).toBe(true)
  })

  it('compte une condition sur l’union des cibles', () => {
    const condition: CompositionCondition = { family: 'threshold', section: 'captain', count: 2, comparator: 'more', targets: [{ kind: 'type', value: 'STR' }, { kind: 'class', value: 'Slasher' }], original: '', checkable: true }
    const state = conditionState(condition, [unit('a'), unit('b', { types: ['DEX'], classes: ['Slasher'] })])
    expect(state).toMatchObject({ current: 2, target: 2, done: true })
  })

  it('classe un candidat selon le nombre de positives encore actives', () => {
    const conditions: CompositionCondition[] = [
      { family: 'threshold', section: '', count: 2, comparator: 'more', targets: [{ kind: 'type', value: 'STR' }], original: 'a', checkable: true },
      { family: 'rainbow', section: '', comparator: 'each', targets: [{ kind: 'type', value: 'STR' }, { kind: 'type', value: 'DEX' }], original: 'b', checkable: true },
    ]
    expect(candidateProgress(unit('x'), [], conditions)).toEqual({ score: 2, violates: false })
  })

  it('rend indéterminée une cible de support taggée sur une unité sans tags', () => {
    expect(supportVerdict({ rule: 'S2', groups: [[{ kind: 'tag', value: 'Navy' }]], original: '[Navy] characters' }, unit('x', { tags: [] }))).toBe('indeterminate')
  })
})
