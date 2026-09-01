import { describe, expect, it } from 'vitest'
import { parseCompositionCondition, parseEnemyCounters, parsePotentialCounters, parseSupportTarget } from './data-utils.mjs'

const tags = ['Navy', 'Straw Hat Pirates', 'Giant']

describe('harnais cover4 — grammaire des conditions', () => {
  const cases = [
    ['R1', 'If your crew has 4+ [Navy] or Slasher characters'],
    ['R1b', 'If your crew has 4+ [Navy] or 2+ Slasher characters'],
    ['R2', 'If your crew has only [Navy] characters'],
    ['R3', 'If there is a Slasher character on your crew'],
    ['R4', 'If there are no [Navy] characters in your crew'],
    ['R5', 'If you have 3 or more Fighter characters'],
    ['R6', 'Boosts ATK depending on the number of Slasher characters on the crew'],
    ['R7', 'Your crew must consist of any 3 of the following: Monkey D. Luffy, Roronoa Zoro, Nami'],
    ['R8', 'If your crew has Roronoa Zoro as a member or supporting'],
    ['R9', 'If 3 [Navy] characters are on the crew'],
    ['R9b', 'When any 3 [Giant] characters are on the crew'],
  ]
  it.each(cases)('%s reste structuré', (_rule, text) => {
    expect(parseCompositionCondition(text, 'test', tags)?.family).not.toBe('raw')
  })
  it.each(['If there is', "If there's"])('reconnaît un arc-en-ciel « %s » comme cinq cases distinctes', prefix => {
    const parsed = parseCompositionCondition(`${prefix} a [STR], [DEX], [QCK], [PSY] and [INT] character in your crew`, 'test', tags)
    expect(parsed).toMatchObject({ family: 'rainbow', comparator: 'each' })
    expect(parsed.targets).toHaveLength(5)
  })
})

describe('harnais cover11 — cibles de support', () => {
  const vocab = { tags, families: new Set(['Monkey D. Luffy', 'Roronoa Zoro']), unitNames: new Set(['Pacifista PX-1']) }
  it.each([
    ['S1', 'All characters'],
    ['S2', '[STR] Fighter characters'],
    ['S3', 'Monkey D. Luffy and Roronoa Zoro'],
    ['S4', '[INT] of the following: Monkey D. Luffy, Roronoa Zoro'],
    ['S5', '[PSY] characters with the following Character Tag: [Giant]'],
    ['S6', 'Characters with cost 99 or more'],
  ])('%s reste structuré', (rule, text) => expect(parseSupportTarget(text, vocab).rule).toBe(rule))
})

describe('grammaire des contres aux effets ennemis', () => {
  it('extrait une réduction simple avec sa durée et sa source', () => {
    expect(parseEnemyCounters("Reduces enemies' Barrier duration by 2 turns", 'special')).toEqual([
      { effect: 'Barrier', nature: 'reduce', turns: 2, source: 'special' },
    ])
  })

  it('sépare les effets qui partagent une durée', () => {
    expect(parseEnemyCounters("Reduces enemies' Increased Defense and Percent Damage Reduction duration by 4 turns", 'special')).toEqual([
      { effect: 'Increased Defense', nature: 'reduce', turns: 4, source: 'special' },
      { effect: 'Percent Damage Reduction', nature: 'reduce', turns: 4, source: 'special' },
    ])
  })

  it('sépare aussi les réductions directes et rejette une clause de résistance complexe', () => {
    expect(parseEnemyCounters("Reduces enemies' ATK Up and Enrage by 3 turns", 'special')).toEqual([
      { effect: 'ATK Up', nature: 'reduce', turns: 3, source: 'special' },
      { effect: 'Enrage', nature: 'reduce', turns: 3, source: 'special' },
    ])
    expect(parseEnemyCounters("Reduces enemies' Fighter and Free Spirit Resistance by 10%-40% based on the duration of End of Turn Healing buff. Reduces End of Turn Healing duration by 10 turns.", 'special')).toEqual([])
  })

  it('accepte les longues listes, les plages et ne mélange pas un effet allié', () => {
    expect(parseEnemyCounters("Reduces enemies' Threshold Damage Reduction, Percent Damage Reduction, End of Turn Heal, Increased Defense and Damage Nullification Buffs duration by 1-5 turns", 'special')).toEqual(expect.arrayContaining([
      { effect: 'Damage Nullification', nature: 'reduce', turns: 5, source: 'special' },
      { effect: 'Threshold Damage Reduction', nature: 'reduce', turns: 5, source: 'special' },
    ]))
    expect(parseEnemyCounters("Reduces enemies' Percent Damage Reduction and crew's Chain Coefficient Reduction duration by 4 turns", 'special')).toEqual([
      { effect: 'Percent Damage Reduction', nature: 'reduce', turns: 4, source: 'special' },
    ])
  })

  it('reconnaît le contournement des barrières du capitaine', () => {
    expect(parseEnemyCounters('Attacks will ignore damage reducing Barriers and Buffs.', 'captain')).toEqual(expect.arrayContaining([
      { effect: 'Barrier', nature: 'ignore', source: 'captain' },
      { effect: 'Percent Damage Reduction', nature: 'ignore', source: 'captain' },
      { effect: 'Threshold Damage Reduction', nature: 'ignore', source: 'captain' },
      { effect: 'Damage Nullification', nature: 'ignore', source: 'captain' },
    ]))
  })

  it('lit les potential abilities structurellement et conserve le niveau maximal', () => {
    expect(parsePotentialCounters([
      { Name: 'Barrier Penetration', description: ["This character's normal attack will ignore barriers if HP is above 50%"] },
      { Name: 'Slot Barrier', description: ['Reduces Slot Barrier duration by 1 stack on this character', 'Reduces Slot Barrier duration by 7 stacks on this character'] },
    ])).toEqual([
      { effect: 'Barrier', nature: 'ignore', source: 'potential' },
      { effect: 'Slot Barrier', nature: 'reduce', stacks: 7, source: 'potential' },
    ])
  })

  it('indexe une réduction additionnelle conditionnelle et une suppression complète comme réductions', () => {
    expect(parseEnemyCounters("If crew uses a Special to reduce enemies' Resilience or Increased Defense, reduces the duration by 2 additional turns", 'captain')).toEqual([
      { effect: 'Resilience', nature: 'reduce', turns: 2, source: 'captain' },
      { effect: 'Increased Defense', nature: 'reduce', turns: 2, source: 'captain' },
    ])
    expect(parseEnemyCounters("Removes enemies' Threshold Damage Reduction and Percent Damage Reduction duration completely", 'special')).toEqual([
      { effect: 'Threshold Damage Reduction', nature: 'reduce', complete: true, source: 'special' },
      { effect: 'Percent Damage Reduction', nature: 'reduce', complete: true, source: 'special' },
    ])
  })

  it.each([
    'If enemies have a Barrier when the special is activated, boosts ATK by 2x',
    "Creates Big Father's Barrier for 2 turns",
    "Removes enemies' Poison duration completely",
  ])('ignore les faux amis : %s', text => {
    expect(parseEnemyCounters(text, 'special')).toEqual([])
  })
})
