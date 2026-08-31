import type { CompositionCondition, Id, PveTeam, PvpTeam, RumbleCondition, SupportTarget, SupportVerdict, TargetToken, Unit } from './types'

export function matchesToken(unit: Unit, token: TargetToken): boolean {
  if (token.kind === 'type') return unit.types.includes(token.value)
  if (token.kind === 'class') return unit.classes.includes(token.value)
  if (token.kind === 'tag') return unit.tags.includes(token.value)
  return unit.families.includes(token.value) || unit.name === token.value
}

export function matchesAny(unit: Unit, targets: TargetToken[]): boolean {
  return targets.length === 0 || targets.some(token => matchesToken(unit, token))
}

export function conditionKey(condition: CompositionCondition): string {
  return JSON.stringify([condition.family, condition.original, condition.count, condition.comparator, condition.targets])
}

export function mergeConditions(units: Unit[]): { key: string; condition: CompositionCondition; carriers: string[] }[] {
  const merged = new Map<string, { key: string; condition: CompositionCondition; carriers: string[] }>()
  for (const unit of units) for (const condition of unit.conditions) {
    const key = conditionKey(condition)
    const current = merged.get(key)
    if (current) current.carriers.push(unit.name)
    else merged.set(key, { key, condition, carriers: [unit.name] })
  }
  return [...merged.values()]
}

export interface ConditionState { current: number; target?: number; done: boolean; label: string }

export function conditionState(condition: CompositionCondition, crew: Unit[], supports: Unit[] = [], captain?: Unit): ConditionState {
  if (condition.family === 'captain') {
    const done = Boolean(captain)
    return { current: done ? 1 : 0, target: 1, done, label: done ? '✓' : '✗' }
  }
  if (condition.family === 'raw') return { current: 0, done: false, label: 'Information' }
  if (condition.family === 'member') {
    const found = [...crew, ...supports].some(unit => matchesAny(unit, condition.targets))
    return { current: found ? 1 : 0, target: 1, done: found, label: found ? '✓' : '0/1' }
  }
  if (condition.family === 'rainbow') {
    const current = condition.targets.filter(target => crew.some(unit => matchesToken(unit, target))).length
    return { current, target: condition.targets.length, done: current >= condition.targets.length, label: `${current}/${condition.targets.length}` }
  }
  const current = crew.filter(unit => matchesAny(unit, condition.targets)).length
  if (condition.family === 'scaler') return { current, done: false, label: `×${current}` }
  const target = condition.count ?? 1
  const done = condition.comparator === 'less' ? current <= target : condition.comparator === 'exact' ? current === target : condition.comparator === 'only' ? crew.every(unit => matchesAny(unit, condition.targets)) : current >= target
  return { current, target, done, label: condition.comparator === 'only' ? `${current}/${crew.length}` : `${current}/${target}` }
}

export function candidateProgress(candidate: Unit, crew: Unit[], checked: CompositionCondition[]): { score: number; violates: boolean } {
  let score = 0
  let violates = false
  for (const condition of checked) {
    if (condition.negative || condition.comparator === 'only') {
      if (condition.comparator === 'only' && !matchesAny(candidate, condition.targets)) violates = true
      else if (condition.comparator === 'less') {
        const before = conditionState(condition, crew).current
        if (matchesAny(candidate, condition.targets) && before >= (condition.count ?? 0)) violates = true
      } else if (condition.comparator === 'exact') {
        const before = conditionState(condition, crew).current
        if (matchesAny(candidate, condition.targets) && before >= (condition.count ?? 0)) violates = true
      }
      continue
    }
    const before = conditionState(condition, crew)
    if (before.done || condition.family === 'captain' || condition.family === 'raw') continue
    const after = conditionState(condition, [...crew, candidate])
    if (after.current > before.current) score += 1
  }
  return { score, violates }
}

export function hasFamilyConflict(candidate: Unit, occupants: Unit[]): boolean {
  return candidate.families.some(family => occupants.some(unit => unit.id !== candidate.id && unit.families.includes(family)))
}

export function teamCost(team: Pick<PveTeam, 'type' | 'slots' | 'supports'> | Pick<PvpTeam, 'type' | 'slots'>, units: Record<Id, Unit>): number {
  if (team.type === 'pvp') return team.slots.reduce((sum, id) => sum + (id ? units[id]?.rumble?.cost ?? 0 : 0), 0)
  const crew = team.slots.reduce((sum, id, index) => sum + (id && index !== 1 ? units[id]?.cost ?? 0 : 0), 0)
  return crew + Object.values(team.supports).reduce((sum, id) => sum + (units[id]?.cost ?? 0), 0)
}

export function supportVerdict(target: SupportTarget | undefined, supported: Unit): SupportVerdict {
  if (!target?.rule) return 'indeterminate'
  if (target.rule === 'S1') return 'applicable'
  if (target.rule === 'S6') {
    const applies = target.comparator === 'more' ? supported.cost >= (target.cost ?? 0) : supported.cost <= (target.cost ?? 0)
    return applies ? 'applicable' : 'non-applicable'
  }
  const hasTag = target.groups?.flat().some(token => token.kind === 'tag')
  if (hasTag && supported.tags.length === 0) return 'indeterminate'
  const groupMatch = !target.groups?.length || target.groups.some(group => group.every(token => matchesToken(supported, token)))
  const nameMatch = !target.names?.length || target.names.some(entry => entry.names.some(name => supported.families.includes(name) || supported.name === name) && entry.tokens.every(token => matchesToken(supported, token)))
  return groupMatch && nameMatch ? 'applicable' : 'non-applicable'
}

export function matchesModifier(unit: Unit, kind: string, target: string): boolean {
  if (kind === 'type') return unit.types.includes(target)
  if (kind === 'class') return unit.classes.includes(target)
  if (kind === 'rumbleType') return unit.rumble?.rumbleType === target
  if (kind === 'family') return unit.families.includes(target)
  return unit.tags.includes(target)
}

export function rumbleConditionToComposition(condition: RumbleCondition): CompositionCondition | null {
  if (!condition.checkable) return null
  if (condition.type === 'crew') return {
    family: 'threshold', section: 'Rumble', count: Number(condition.count ?? 1), comparator: condition.comparator === 'less' ? 'less' : 'more',
    targets: (Array.isArray(condition.targets) ? condition.targets : []).map(value => { const stringValue = String(value); return { kind: stringValue.startsWith('[') ? (['STR', 'DEX', 'QCK', 'PSY', 'INT'].includes(stringValue.slice(1, -1)) ? 'type' : 'tag') : 'class', value: stringValue.replace(/^\[|\]$/g, '') } as TargetToken }),
    original: condition.original, checkable: true, negative: condition.comparator === 'less',
  }
  if (condition.type === 'character') return { family: 'member', section: 'Rumble', comparator: 'present', targets: (Array.isArray(condition.families) ? condition.families : []).map(value => ({ kind: 'name', value: String(value) })), original: condition.original, checkable: true }
  return null
}
