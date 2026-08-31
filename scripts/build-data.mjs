import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { asArray, downloadData, evaluateDataFile, loadConfig, parseCompositionCondition, parseSupportTarget, splitClauses, unique, walkStrings } from './data-utils.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const config = await loadConfig(root)
const cache = await downloadData(root, config)

const [units, details, families, tags, availableTags, flags, shipsRaw, version] = await Promise.all([
  evaluateDataFile(path.join(cache, 'units.js'), 'units'),
  evaluateDataFile(path.join(cache, 'details.js'), 'details'),
  evaluateDataFile(path.join(cache, 'families.js'), 'families'),
  evaluateDataFile(path.join(cache, 'tags.js'), 'tags'),
  evaluateDataFile(path.join(cache, 'availableTags.js'), 'availableTags'),
  evaluateDataFile(path.join(cache, 'flags.js'), 'flags'),
  evaluateDataFile(path.join(cache, 'ships.js'), 'ships'),
  evaluateDataFile(path.join(cache, 'version.js'), 'dbVersion'),
])
const rumbleJson = JSON.parse(await fs.readFile(path.join(cache, 'rumble.json'), 'utf8'))
const knownTags = unique(Array.isArray(availableTags) ? availableTags.flat(Infinity).filter(value => typeof value === 'string') : Object.keys(availableTags || {}))
const vocab = {
  tags: knownTags,
  families: new Set(Object.values(families || {}).flat(Infinity).filter(value => typeof value === 'string')),
  unitNames: new Set(Object.values(units).map(unit => unit.name)),
}

const rumbleEntries = Array.isArray(rumbleJson) ? rumbleJson : rumbleJson.units || []
const rumbleById = new Map(rumbleEntries.filter(entry => entry.id != null).map(entry => [String(entry.id), entry]))
function resolveRumble(id, seen = new Set()) {
  const entry = rumbleById.get(String(id))
  if (!entry || seen.has(String(id))) return null
  if (entry.basedOn != null) return resolveRumble(entry.basedOn, new Set([...seen, String(id)]))
  return entry
}

function flattenTags(value) {
  return unique(asArray(value).filter(item => typeof item === 'string'))
}

function extractRumbleConditions(entry) {
  const conditions = []
  const visit = value => {
    if (!value || typeof value !== 'object') return
    if (typeof value.type === 'string' && ['crew', 'character', 'multi', 'mode', 'time', 'stat', 'enemies', 'trigger', 'specialreceived', 'dmgreceived', 'dbfreceived', 'heal', 'debuff'].includes(value.type)) {
      const composition = (value.type === 'crew' && value.composition === true) || value.type === 'character' || value.type === 'multi'
      conditions.push({ ...value, checkable: composition, original: describeRumbleCondition(value) })
    }
    Object.values(value).forEach(visit)
  }
  visit(entry?.ability)
  visit(entry?.special)
  visit(entry?.superspecial)
  return [...new Map(conditions.map(condition => [JSON.stringify(condition), condition])).values()]
}

function describeRumbleCondition(condition) {
  if (condition.type === 'crew' && condition.composition) return `${condition.count ?? 1}${condition.comparator === 'more' ? '+' : ''} ${asArray(condition.targets).join(' ou ')} dans l’équipe`
  if (condition.type === 'character') return `Présence : ${asArray(condition.families).join(' ou ')}`
  if (condition.type === 'mode') return `Mode : ${condition.mode}`
  if (condition.type === 'multi') return `Condition combinée (${condition.comparator || condition.operator || 'multi'})`
  return `Condition de combat : ${condition.type}`
}

const generatedUnits = {}
let parsedConditions = 0
let rawConditions = 0
let parsedSupports = 0
let rawSupports = 0
for (const [id, raw] of Object.entries(units)) {
  const detail = details?.[id] || {}
  const conditions = []
  const compositionSources = { captain: detail.captain, captainNotes: detail.captainNotes, special: detail.special, specialNotes: detail.specialNotes, sailor: detail.sailor, superSpecialCriteria: detail.superSpecialCriteria, superTandem: detail.superTandem?.characterCondition, potential: detail.potential, limit: detail.limit, rush: detail.rush?.characterCondition, lastTap: detail.lastTap?.condition }
  for (const { section, text } of walkStrings(compositionSources)) {
    for (const clause of splitClauses(text)) {
      const condition = parseCompositionCondition(clause, section, knownTags)
      if (condition) {
        conditions.push(condition)
        condition.family === 'raw' ? rawConditions += 1 : parsedConditions += 1
      }
    }
  }
  const supportText = detail.support?.[0]?.Characters
  const supportTarget = supportText ? parseSupportTarget(supportText, vocab) : undefined
  if (supportTarget) supportTarget.rule ? parsedSupports += 1 : rawSupports += 1
  const rumble = resolveRumble(id)
  generatedUnits[id] = {
    id: String(raw.id ?? id),
    name: raw.name,
    types: asArray(raw.type),
    classes: asArray(raw.class),
    stars: raw.stars,
    cost: Number(raw.cost || 0),
    combo: Number(raw.combo || 0),
    families: asArray(families?.[id]),
    tags: flattenTags(tags?.[id]),
    flags: Object.entries(flags?.[id] || {}).filter(([, enabled]) => enabled).map(([flag]) => flag),
    conditions,
    supportTarget,
    rumble: rumble ? {
      rumbleType: rumble.stats?.rumbleType,
      def: rumble.stats?.def,
      spd: rumble.stats?.spd,
      cost: Number(rumble.cost ?? raw.cost ?? 0),
      conditions: extractRumbleConditions(rumble),
    } : undefined,
  }
}

const historicalSeed = JSON.parse(await fs.readFile(path.join(root, 'seed.json'), 'utf8'))
const seed = unique(historicalSeed.map(id => String(id))).filter(id => generatedUnits[id])
const ships = asArray(shipsRaw).map((ship, index) => ship && ship.name ? ({ id: String(index), name: ship.name, thumb: ship.thumb || `ship_${String(index + 1).padStart(4, '0')}_t2.png`, description: ship.description || '' }) : null).filter(Boolean)
const index = {
  meta: { dbVersion: version, sha: config.sha, repository: config.repository, cdn: config.cdn, generatedAt: new Date().toISOString(), coverage: { parsedConditions, rawConditions, parsedSupports, rawSupports } },
  units: generatedUnits,
  ships,
  seed,
  filters: {
    types: unique(Object.values(generatedUnits).flatMap(unit => unit.types)).sort(),
    classes: unique(Object.values(generatedUnits).flatMap(unit => unit.classes)).sort(),
    tags: unique(Object.values(generatedUnits).flatMap(unit => unit.tags)).sort(),
  },
}
const outDir = path.join(root, 'src', 'generated')
await fs.mkdir(outDir, { recursive: true })
await fs.writeFile(path.join(outDir, 'index.json'), JSON.stringify(index))
console.log(`Index généré: ${Object.keys(generatedUnits).length} unités, ${ships.length} bateaux, seed ${seed.length} IDs.`)
console.warn(`Couverture informative: conditions ${parsedConditions} parsées / ${rawConditions} fallback; supports ${parsedSupports} parsés / ${rawSupports} fallback.`)
const COVERAGE_BASELINES = { conditions: 2083, supports: 2259 } // Corpus documentés dans wayfinder/research/004 et 011.
if (parsedConditions < COVERAGE_BASELINES.conditions) console.warn(`AVERTISSEMENT couverture conditions: ${parsedConditions} < baseline ${COVERAGE_BASELINES.conditions} (rapport cover4).`)
if (parsedSupports < COVERAGE_BASELINES.supports) console.warn(`AVERTISSEMENT couverture supports: ${parsedSupports} < baseline ${COVERAGE_BASELINES.supports} (rapport cover11).`)
