export type Id = string
export type TeamType = 'pve' | 'pvp'
export type TokenKind = 'type' | 'class' | 'tag' | 'name'
export type ConditionComparator = 'captain' | 'present' | 'more' | 'less' | 'exact' | 'only' | 'each' | 'scale' | 'info'
export type SupportRule = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6'

export interface TargetToken { kind: TokenKind; value: string }
export interface CompositionCondition {
  family: 'threshold' | 'roster' | 'rainbow' | 'scaler' | 'member' | 'captain' | 'multi' | 'raw'
  section: string
  count?: number
  alternateCount?: number
  comparator: ConditionComparator
  targets: TargetToken[]
  original: string
  checkable: boolean
  negative?: boolean
  conjunction?: 'and' | 'or'
  branches?: CompositionCondition[]
}
export interface SupportTarget {
  rule?: SupportRule
  groups?: TargetToken[][]
  names?: { names: string[]; tokens: TargetToken[] }[]
  cost?: number
  comparator?: string
  original: string
}
export interface RumbleCondition {
  type: 'crew' | 'character' | 'multi' | 'mode' | 'time' | 'stat' | 'enemies' | 'trigger' | 'specialreceived' | 'dmgreceived' | 'dbfreceived' | 'heal' | 'debuff'
  checkable: boolean
  original: string
  comparator?: string
  conjunction?: string
  count?: number
  targets?: unknown[]
  families?: unknown[]
  conditions?: RumbleCondition[]
  [key: string]: unknown
}
export interface EnemyCounter {
  effect: string
  nature: 'ignore' | 'reduce'
  turns?: number
  stacks?: number
  complete?: boolean
  source: 'special' | 'captain' | 'potential'
}
export interface Unit {
  id: Id
  name: string
  types: string[]
  classes: string[]
  stars: string | null
  cost: number
  combo: number
  families: string[]
  tags: string[]
  flags: string[]
  conditions: CompositionCondition[]
  counters: EnemyCounter[]
  supportTarget?: SupportTarget
  rumble?: { rumbleType?: string; def?: number; spd?: number; cost: number; conditions: RumbleCondition[] }
}
export interface Ship { id: Id; name: string; thumb: string; description: string }
export interface DataIndex {
  meta: { dbVersion: string | number; sha: string; repository: string; cdn: string; generatedAt: string; coverage: Record<string, number> }
  units: Record<Id, Unit>
  ships: Ship[]
  seed: Id[]
  filters: { types: string[]; classes: string[]; tags: string[]; effects: string[] }
}
export interface PveTeam {
  id: string
  type: 'pve'
  name: string
  slots: [Id | null, Id | null, Id | null, Id | null, Id | null, Id | null]
  supports: Record<number, Id>
  shipId: Id | null
  checkedConditions: string[]
}
export interface PvpModifier {
  id: string
  targetKind: 'type' | 'class' | 'rumbleType' | 'family' | 'tag'
  target: string
  hp: number
  atk: number
  rcv: number
  def: number
  spd: number
}
export interface PvpTeam {
  id: string
  type: 'pvp'
  name: string
  slots: (Id | null)[]
  mode: 'normal' | 'assault'
  modifiers: PvpModifier[]
  checkedConditions: string[]
}
export type Team = PveTeam | PvpTeam
export interface CostCaps { pve: number; pvp: number }
export type SupportVerdict = 'applicable' | 'non-applicable' | 'indeterminate'
