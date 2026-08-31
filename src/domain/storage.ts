import type { CostCaps, Id, Team } from './types'

const keys = { box: 'optc.v1.box', ships: 'optc.v1.ships', teams: 'optc.v1.teams', caps: 'optc.v1.costCaps' } as const

function read<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
function write<T>(key: string, value: T): T { localStorage.setItem(key, JSON.stringify(value)); return value }

export const storage = {
  box(seed: Id[]): Id[] {
    if (localStorage.getItem(keys.box) === null) write(keys.box, seed)
    return read(keys.box, seed)
  },
  setBox: (ids: Id[]) => write(keys.box, [...new Set(ids)]),
  ships: () => read<Id[]>(keys.ships, []),
  setShips: (ids: Id[]) => write(keys.ships, [...new Set(ids)]),
  teams: () => read<Team[]>(keys.teams, []),
  setTeams: (teams: Team[]) => write(keys.teams, teams),
  caps: () => read<CostCaps>(keys.caps, { pve: 300, pvp: 300 }),
  setCaps: (caps: CostCaps) => write(keys.caps, caps),
}

export const createTeam = (type: 'pve' | 'pvp', name: string): Team => type === 'pve' ? {
  id: crypto.randomUUID(), type, name, slots: [null, null, null, null, null, null], supports: {}, shipId: null, checkedConditions: [],
} : {
  id: crypto.randomUUID(), type, name, slots: Array(8).fill(null), mode: 'normal', modifiers: [], checkedConditions: [],
}
