import { describe, expect, it } from 'vitest'
import { parseCompositionCondition, parseSupportTarget } from './data-utils.mjs'

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
