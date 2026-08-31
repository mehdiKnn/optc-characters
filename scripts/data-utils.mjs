import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

export const DATA_FILES = [
  'units.js', 'details.js', 'families.js', 'tags.js', 'availableTags.js',
  'flags.js', 'ships.js', 'rumble.json', 'version.js',
]

export async function loadConfig(root) {
  return JSON.parse(await fs.readFile(path.join(root, 'data-source.json'), 'utf8'))
}

export async function downloadData(root, config, force = false) {
  const cache = path.join(root, '.cache', 'optc-data', config.sha)
  await fs.mkdir(cache, { recursive: true })
  for (const file of DATA_FILES) {
    const destination = path.join(cache, file)
    if (!force) {
      try { await fs.access(destination); continue } catch { /* download */ }
    }
    const url = `https://raw.githubusercontent.com/${config.repository}/${config.sha}/common/data/${file}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`)
    await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()))
  }
  return cache
}

export async function evaluateDataFile(file, globalName) {
  const source = await fs.readFile(file, 'utf8')
  const sandbox = { window: {} }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: file, timeout: 30_000 })
  return sandbox.window[globalName]
}

export const asArray = value => value == null ? [] : Array.isArray(value) ? value.flat(Infinity).filter(Boolean) : [value]
export const unique = values => [...new Set(values.filter(Boolean))]

export function splitClauses(text) {
  return String(text)
    .replace(/<br\s*\/?\s*>|<\/?li[^>]*>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .split(/(?<=[.;])\s+|\n+/)
    .map(value => value.trim())
    .filter(Boolean)
}

const TYPES = ['STR', 'DEX', 'QCK', 'PSY', 'INT', 'RCV', 'TND']
const CLASSES = ['Fighter', 'Slasher', 'Striker', 'Shooter', 'Free Spirit', 'Cerebral', 'Powerhouse', 'Driven', 'Evolver', 'Booster']

export function tokenizeGroup(text, knownTags = []) {
  const tokens = []
  const bracketed = [...String(text).matchAll(/\[([^\]]+)\]/g)].map(match => match[1])
  for (const value of bracketed) {
    tokens.push({ kind: TYPES.includes(value) ? 'type' : 'tag', value: normalizeTag(value, knownTags) })
  }
  const plain = String(text).replace(/\[[^\]]+\]/g, ' ')
  for (const value of CLASSES) {
    if (new RegExp(`\\b${value.replace(' ', '\\s+')}\\b`, 'i').test(plain)) tokens.push({ kind: 'class', value })
  }
  return uniqueTokens(tokens)
}

function normalizeTag(value, knownTags) {
  if (knownTags.includes(value)) return value
  const former = `Former / ${value}`
  if (knownTags.includes(former)) return former
  const fruit = `${value} / Devil Fruit User`
  return knownTags.includes(fruit) ? fruit : value
}

const uniqueTokens = tokens => [...new Map(tokens.map(token => [`${token.kind}:${token.value}`, token])).values()]

export function parseCompositionCondition(text, section, knownTags = []) {
  const original = String(text).replace(/\s+/g, ' ').trim()
  if (!original) return null
  if (/This character must be captain/i.test(original)) {
    return { family: 'captain', section, comparator: 'captain', targets: [], original, checkable: false }
  }
  const member = original.match(/crew has (.+?) as (?:a )?member(?: or supporting)?/i)
  if (member) return { family: 'member', section, comparator: 'present', targets: [{ kind: 'name', value: member[1].trim() }], original, checkable: true }
  const roster = original.match(/crew must consist of (?:any\s+)?(\d+)(?:\s+or\s+(\d+))?[^:]*:\s*(.+)/i)
  if (roster) {
    const names = splitNames(roster[3]).map(value => ({ kind: 'name', value }))
    const structured = tokenizeGroup(roster[3], knownTags)
    return { family: 'roster', section, count: Number(roster[1]), alternateCount: roster[2] ? Number(roster[2]) : undefined, comparator: 'more', targets: structured.length ? structured : names, original, checkable: true }
  }
  const rainbow = original.match(/at least one of each\s*:\s*(.+?)(?:\.|$)/i)
  if (rainbow && !/orb/i.test(original)) return { family: 'rainbow', section, comparator: 'each', targets: tokenizeGroup(rainbow[1], knownTags), original, checkable: true }
  const scaler = original.match(/(?:based on|depending on) (?:the number of|how many) (.+?) characters?/i)
  if (scaler) return { family: 'scaler', section, comparator: 'scale', targets: tokenizeGroup(scaler[1], knownTags), original, checkable: true }
  const absence = original.match(/there are no (.+?) characters? (?:on|in)/i)
  if (absence) return { family: 'threshold', section, count: 0, comparator: 'exact', targets: tokenizeGroup(absence[1], knownTags), original, checkable: true, negative: true }
  const only = original.match(/crew has only (.+?) characters?/i)
  if (only) return { family: 'threshold', section, comparator: 'only', targets: tokenizeGroup(only[1], knownTags), original, checkable: true, negative: true }
  const threshold = original.match(/(?:crew has|you(?:r crew)? ha(?:ve|s)|If there (?:is|are)|When any)\s+(\d+)(\+|\s+or more|\s+or fewer|\s+or less)?\s+(.+?)\s+characters?\b/i)
  if (threshold) {
    const op = threshold[2]?.trim().toLowerCase()
    const comparator = op === 'or fewer' || op === 'or less' ? 'less' : op ? 'more' : 'exact'
    return { family: 'threshold', section, count: Number(threshold[1]), comparator, targets: tokenizeGroup(threshold[3], knownTags), original, checkable: true, negative: comparator === 'less' }
  }
  if (/crew|characters? (?:on|in) (?:the|your) crew/i.test(original)) {
    return { family: 'raw', section, comparator: 'info', targets: [], original, checkable: false }
  }
  return null
}

export function splitNames(value) {
  const result = []
  let depth = 0
  let start = 0
  const source = String(value).trim().replace(/[.;]+$/, '')
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '(') depth += 1
    if (source[index] === ')') depth -= 1
    if (depth === 0) {
      const rest = source.slice(index)
      const match = rest.match(/^(,\s*|\s+(?:and|or)\s+)/i)
      if (match) {
        result.push(source.slice(start, index).trim())
        index += match[0].length - 1
        start = index + 1
      }
    }
  }
  result.push(source.slice(start).trim())
  return result.filter(Boolean)
}

export function parseSupportTarget(text, vocab) {
  const original = String(text || '').trim()
  if (!original) return null
  if (/^All characters$/i.test(original)) return { rule: 'S1', groups: [], original }
  const cost = original.match(/^Characters with cost (\d+) or (more|less)$/i)
  if (cost) return { rule: 'S6', groups: [], cost: Number(cost[1]), comparator: cost[2].toLowerCase(), original }
  const typedNames = original.match(/^(.+?) of the following:\s*(.+)$/i)
  if (typedNames) {
    return { rule: 'S4', groups: [tokenizeGroup(typedNames[1], vocab.tags)], names: resolveNames(typedNames[2], vocab), original }
  }
  const tagSuffix = original.match(/^(.+?)?\s*characters? with the following Character Tags?:\s*(.+)$/i)
  if (tagSuffix) return { rule: 'S5', groups: [tokenizeGroup(tagSuffix[1], vocab.tags), tokenizeGroup(tagSuffix[2], vocab.tags)].filter(group => group.length), original }
  if (/characters?$/i.test(original)) {
    const body = original.replace(/\s+(?:class\s+)?characters?$/i, '')
    const parts = body.split(/\s*(?:,|\bor\b|\band\b)\s*/i).filter(Boolean)
    const groups = parts.map(part => tokenizeGroup(part.replaceAll('/', ' or '), vocab.tags)).filter(group => group.length)
    if (groups.length) return { rule: 'S2', groups, original }
  }
  const names = resolveNames(original, vocab)
  if (names.length) return { rule: 'S3', groups: [], names, original }
  return { original }
}

function resolveNames(value, vocab) {
  const aliases = { 'Howling Gabu': 'Gabu', 'Building Snake': 'Snake', Gen: 'Genzo', 'Mr. Tom': 'Tom', Onion: 'Onion, Pepper & Carrot', Pepper: 'Onion, Pepper & Carrot' }
  const resolved = []
  for (const raw of splitNames(value)) {
    const token = raw.replace(/^(?:Sir|Dr\.)\s+/, '').trim()
    const groupPrefix = tokenizeGroup(token, vocab.tags)
    const clean = token.replace(/\[[^\]]+\]|\b(?:Fighter|Slasher|Striker|Shooter|Free Spirit|Cerebral|Powerhouse|Driven)\b/gi, '').trim()
    const parenthetical = clean.match(/^(.+?)\s*\((.+)\)$/)
    const candidates = parenthetical ? [parenthetical[1], parenthetical[2]] : [aliases[clean] || clean]
    const valid = candidates.filter(name => vocab.families.has(name) || vocab.unitNames.has(name))
    if (!valid.length) return []
    resolved.push({ names: valid, tokens: groupPrefix })
  }
  return resolved
}

export function walkStrings(value, pathParts = [], output = []) {
  if (typeof value === 'string') output.push({ section: pathParts.join('.'), text: value })
  else if (Array.isArray(value)) value.forEach((child, index) => walkStrings(child, [...pathParts, String(index)], output))
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, child]) => walkStrings(child, [...pathParts, key], output))
  return output
}
