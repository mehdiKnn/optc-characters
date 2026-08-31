export type Id = string
export type TeamType = 'pve' | 'pvp'
export type TokenKind = 'type' | 'class' | 'tag' | 'name'

export interface TargetToken { kind: TokenKind; value: string }
export interface CompositionCondition {
  family: 'threshold' | 'roster' | 'rainbow' | 'scaler' | 'member' | 'captain' | 'raw'
  section: string
  count?: number
  alternateCount?: number
  comparator: string
  targets: TargetToken[]
  original: string
  checkable: boolean
  negative?: boolean
}
export interface SupportTarget {
  rule?: string
  groups?: TargetToken[][]
  names?: { names: string[]; tokens: TargetToken[] }[]
  cost?: number
  comparator?: string
  original: string
}
export interface RumbleCondition extends Record<string, unknown> { type: string; checkable: boolean; original: string }
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
  supportTarget?: SupportTarget
  rumble?: { rumbleType?: string; def?: number; spd?: number; cost: number; conditions: RumbleCondition[] }
}
export interface Ship { id: Id; name: string; thumb: string; description: string }
export interface DataIndex {
  meta: { dbVersion: string | number; sha: string; repository: string; cdn: string; generatedAt: string; coverage: Record<string, number> }
  units: Record<Id, Unit>
  ships: Ship[]
  seed: Id[]
  filters: { types: string[]; classes: string[]; tags: string[] }
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
