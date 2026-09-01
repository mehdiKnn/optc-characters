import { useMemo, useState } from 'react'
import { Box, Check, ChevronLeft, Copy, Plus, Save, Search, Shield, ShipWheel, Swords, Trash2, Users, X } from 'lucide-react'
import rawData from './generated/index.json'
import { addMergedCondition, candidateProgress, conditionState, hasFamilyConflict, matchesModifier, mergeConditions, rumbleConditionsToComposition, supportVerdict, teamCost, type MergedCondition } from './domain/engine'
import { conditionSectionLabel, conditionSummary } from './domain/conditionPresentation'
import { createTeam, storage } from './domain/storage'
import type { CompositionCondition, CostCaps, DataIndex, EnemyCounter, Id, PveTeam, PvpModifier, PvpTeam, Team, Unit } from './domain/types'

const data = rawData as unknown as DataIndex
const allUnits = Object.values(data.units)
type Page = 'teams' | 'box' | 'browse' | 'builder'

const portrait = (id: Id) => {
  const numeric = Number.parseInt(id, 10)
  const padded = String(numeric).padStart(4, '0')
  return `${data.meta.cdn}/api/images/thumbnail/glo/${Math.floor(numeric / 1000)}/${Math.floor((numeric % 1000) / 100)}00/${padded}.png`
}
const shipImage = (thumb: string) => `${data.meta.cdn}/res/${thumb}`
const byDescendingId = (a: Unit, b: Unit) => Number.parseInt(b.id) - Number.parseInt(a.id)
type UnitFilters = { query: string; type: string; unitClass: string; tag: string; effect: string }
const emptyFilters = (): UnitFilters => ({ query: '', type: '', unitClass: '', tag: '', effect: '' })
const matchesUnitFilters = (unit: Unit, filters: UnitFilters) => (!filters.query || `${unit.id} ${unit.name}`.toLowerCase().includes(filters.query.toLowerCase())) && (!filters.type || unit.types.includes(filters.type)) && (!filters.unitClass || unit.classes.includes(filters.unitClass)) && (!filters.tag || unit.tags.includes(filters.tag)) && (!filters.effect || unit.counters.some(counter => counter.effect === filters.effect))

export default function App() {
  const [page, setPage] = useState<Page>('teams')
  const [boxIds, setBoxIds] = useState<Id[]>(() => storage.box(data.seed))
  const [ownedShips, setOwnedShips] = useState<Id[]>(storage.ships)
  const [teams, setTeams] = useState<Team[]>(storage.teams)
  const [caps, setCaps] = useState<CostCaps>(storage.caps)
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)

  const changeTeams = (next: Team[]) => { setTeams(next); storage.setTeams(next) }
  const openTeam = (id: string) => { setActiveTeamId(id); setPage('builder') }
  const activeTeam = teams.find(team => team.id === activeTeamId)

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setPage('teams')} aria-label="Accueil OPTC Crew Lab"><span className="brand-mark"><Swords size={18} /></span><span>OPTC <b>Crew Lab</b></span></button>
      <nav aria-label="Navigation principale">
        <button className={page === 'teams' ? 'active' : ''} onClick={() => setPage('teams')}><Users size={16} /> Équipes</button>
        <button className={page === 'box' ? 'active' : ''} onClick={() => setPage('box')}><Box size={16} /> Ma box <span className="nav-count">{boxIds.length}</span></button>
        <button className={page === 'browse' ? 'active' : ''} onClick={() => setPage('browse')}><Search size={16} /> Base</button>
      </nav>
      <span className="db-chip">DB {data.meta.dbVersion}</span>
    </header>

    {page === 'teams' && <TeamsHome teams={teams} caps={caps} onCaps={next => { setCaps(next); storage.setCaps(next) }} onChange={changeTeams} onOpen={openTeam} />}
    {page === 'box' && <BoxPage boxIds={boxIds} ownedShips={ownedShips} onBox={ids => { setBoxIds(ids); storage.setBox(ids) }} onShips={ids => { setOwnedShips(ids); storage.setShips(ids) }} />}
    {page === 'browse' && <Browser boxIds={boxIds} />}
    {page === 'builder' && activeTeam && <TeamBuilder team={activeTeam} boxIds={boxIds} cap={caps[activeTeam.type]} onBack={() => setPage('teams')} onChange={team => changeTeams(teams.map(item => item.id === team.id ? team : item))} />}
    {page === 'builder' && !activeTeam && <Empty title="Équipe introuvable" body="Revenez à la liste pour choisir une équipe." action="Voir mes équipes" onAction={() => setPage('teams')} />}

    <footer>OPTC Crew Lab · données optc-db <code>{data.meta.sha.slice(0, 9)}</code> · fan project GPLv3, non affilié à Bandai Namco</footer>
  </div>
}

function TeamsHome({ teams, caps, onCaps, onChange, onOpen }: { teams: Team[]; caps: CostCaps; onCaps: (caps: CostCaps) => void; onChange: (teams: Team[]) => void; onOpen: (id: string) => void }) {
  const add = (type: 'pve' | 'pvp') => onChange([...teams, createTeam(type, type === 'pve' ? 'Nouvelle équipe PVE' : 'Nouvelle équipe Rumble')])
  const remove = (team: Team) => { if (confirm(`Supprimer « ${team.name} » ?`)) onChange(teams.filter(item => item.id !== team.id)) }
  const duplicate = (team: Team) => onChange([...teams, { ...structuredClone(team), id: crypto.randomUUID(), name: `${team.name} — copie` }])
  return <main className="page page-wide">
    <div className="page-heading"><div><p className="eyebrow">Atelier d’équipage</p><h1>Mes équipes</h1><p>Composez, vérifiez les conditions et gardez vos formations disponibles hors ligne.</p></div><div className="heading-actions"><button className="button secondary" onClick={() => add('pvp')}><Shield size={16} /> Rumble</button><button className="button primary" onClick={() => add('pve')}><Plus size={16} /> Équipe PVE</button></div></div>
    <section className="caps-bar" aria-label="Plafonds de coût"><span>Plafonds mémorisés</span><label>PVE <input type="number" min="0" value={caps.pve} onChange={event => onCaps({ ...caps, pve: Number(event.target.value) })} /></label><label>PVP <input type="number" min="0" value={caps.pvp} onChange={event => onCaps({ ...caps, pvp: Number(event.target.value) })} /></label></section>
    {!teams.length ? <Empty title="Votre chantier est prêt" body="Créez une équipe PVE ou Pirate Rumble. Une composition incomplète peut déjà être sauvegardée." action="Créer une équipe PVE" onAction={() => add('pve')} /> : <div className="team-list">{teams.map(team => {
      const cost = teamCost(team, data.units); const over = cost > caps[team.type]; const filled = team.slots.filter(Boolean).length
      return <article className="team-row" key={team.id} onClick={() => onOpen(team.id)}>
        <span className={`mode-icon ${team.type}`}><>{team.type === 'pve' ? <Swords /> : <Shield />}</></span>
        <div className="team-meta"><span className={`mode-label ${team.type}`}>{team.type === 'pve' ? 'PVE' : 'PIRATE RUMBLE'}</span><h2>{team.name}</h2><p>{filled}/{team.type === 'pve' ? 6 : 8} personnages {team.type === 'pvp' && team.mode === 'assault' ? '· Assault Rumble' : ''}</p></div>
        <div className="mini-crew">{team.slots.slice(0, 6).map((id, index) => id ? <img key={index} src={portrait(id)} alt="" width="38" height="38" /> : <span key={index} />)}</div>
        <div className={`team-cost ${over ? 'over' : ''}`}><b>{cost}</b><span>/ {caps[team.type]} coût</span>{over && <em>Dépassement</em>}</div>
        <div className="row-actions"><button aria-label="Dupliquer" onClick={event => { event.stopPropagation(); duplicate(team) }}><Copy size={16} /></button><button className="danger" aria-label="Supprimer" onClick={event => { event.stopPropagation(); remove(team) }}><Trash2 size={16} /></button></div>
      </article>
    })}</div>}
  </main>
}

type BatchToken = { raw: string; id?: Id; suggestion?: Id; accepted?: boolean }
function BoxPage({ boxIds, ownedShips, onBox, onShips }: { boxIds: Id[]; ownedShips: Id[]; onBox: (ids: Id[]) => void; onShips: (ids: Id[]) => void }) {
  const [input, setInput] = useState('')
  const [tokens, setTokens] = useState<BatchToken[]>([])
  const [tab, setTab] = useState<'characters' | 'ships'>('characters')
  const elect = (source = input) => {
    const values = source.split(/\D+/).filter(Boolean)
    if (!values.length) return
    setTokens(current => [...current, ...values.map(raw => data.units[raw] ? { raw, id: raw } : data.units[String(Number(raw) + 1)] ? { raw, suggestion: String(Number(raw) + 1) } : { raw })])
    setInput('')
  }
  const add = () => { const accepted = tokens.flatMap(token => token.id ? [token.id] : token.accepted && token.suggestion ? [token.suggestion] : []); onBox([...boxIds, ...accepted]); setTokens(tokens.filter(token => !token.id && !(token.accepted && token.suggestion))) }
  const remove = (id: Id) => { if (confirm(`Retirer ${data.units[id].name} de votre box ?`)) onBox(boxIds.filter(item => item !== id)) }
  return <main className="page page-wide">
    <div className="page-heading"><div><p className="eyebrow">Collection locale</p><h1>Ma box</h1><p>{boxIds.length} personnages · {ownedShips.length} bateaux possédés</p></div><div className="segmented"><button className={tab === 'characters' ? 'active' : ''} onClick={() => setTab('characters')}>Personnages</button><button className={tab === 'ships' ? 'active' : ''} onClick={() => setTab('ships')}>Bateaux</button></div></div>
    {tab === 'characters' ? <>
      <section className="batch-panel"><div><h2>Ajouter plusieurs IDs</h2><p>Un espace valide la saisie ; un collage est découpé sur tout caractère non numérique.</p></div><div className="batch-input"><div className="token-field">{tokens.map((token, index) => <span className={`input-token ${token.id || token.accepted ? 'valid' : 'invalid'}`} key={`${token.raw}-${index}`}>{token.id ? <><Check size={12} /> #{token.id} {data.units[token.id].name}</> : token.suggestion ? <>#{token.raw} inconnu · <button onClick={() => setTokens(tokens.map((item, position) => position === index ? { ...item, accepted: !item.accepted } : item))}>{token.accepted ? <Check size={12} /> : <Plus size={12} />} accepter #{token.suggestion} {data.units[token.suggestion].name}</button></> : <>#{token.raw} inconnu</>}<button aria-label="Retirer le jeton" onClick={() => setTokens(tokens.filter((_, position) => position !== index))}><X size={12} /></button></span>)}<input inputMode="numeric" value={input} placeholder="Ex. 4380 4631…" onChange={event => setInput(event.target.value)} onBlur={() => elect()} onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); elect() } }} onPaste={event => { const pasted = event.clipboardData.getData('text'); if (/\D/.test(pasted)) { event.preventDefault(); elect(pasted) } }} /></div><button className="button primary" disabled={!tokens.some(token => token.id || token.accepted)} onClick={add}>Ajouter à la box</button></div></section>
      <CharacterGrid units={boxIds.map(id => data.units[id]).filter(Boolean).sort(byDescendingId)} action={unit => <button className="tile-remove" aria-label={`Retirer ${unit.name}`} onClick={() => remove(unit.id)}><X size={14} /></button>} />
    </> : <div className="ship-grid">{data.ships.map(ship => <label className={`ship-card ${ownedShips.includes(ship.id) ? 'owned' : ''}`} key={ship.id}><input type="checkbox" checked={ownedShips.includes(ship.id)} onChange={() => onShips(ownedShips.includes(ship.id) ? ownedShips.filter(id => id !== ship.id) : [...ownedShips, ship.id])} /><img src={shipImage(ship.thumb)} alt="" width="86" height="60" /><span><b>{ship.name}</b><small>{ship.description}</small></span></label>)}</div>}
  </main>
}

function Browser({ boxIds }: { boxIds: Id[] }) {
  const [mine, setMine] = useState(true)
  const [filters, setFilters] = useState<UnitFilters>(emptyFilters)
  const units = useMemo(() => allUnits.filter(unit => (!mine || boxIds.includes(unit.id)) && matchesUnitFilters(unit, filters)).sort(byDescendingId), [mine, boxIds, filters])
  return <main className="page page-wide"><div className="page-heading"><div><p className="eyebrow">5 027 unités indexées</p><h1>Base de personnages</h1><p>Filtres en intersection, sans fiche détail.</p></div></div><Filters filters={filters} onChange={patch => setFilters(current => ({ ...current, ...patch }))}><label className="mine-toggle"><input type="checkbox" checked={mine} onChange={event => setMine(event.target.checked)} /> Ma box</label></Filters><p className="result-count">{units.length} résultats</p><CharacterGrid units={units} counterEffect={filters.effect} /></main>
}

function Filters({ filters, onChange, showEffect = true, children }: { filters: UnitFilters; onChange: (patch: Partial<UnitFilters>) => void; showEffect?: boolean; children?: React.ReactNode }) {
  return <div className="filters"><label className="search-field"><Search size={16} /><input value={filters.query} onChange={event => onChange({ query: event.target.value })} placeholder="Nom ou ID…" /></label><select aria-label="Type" value={filters.type} onChange={event => onChange({ type: event.target.value })}><option value="">Tous les types</option>{data.filters.types.map(value => <option key={value}>{value}</option>)}</select><select aria-label="Classe" value={filters.unitClass} onChange={event => onChange({ unitClass: event.target.value })}><option value="">Toutes les classes</option>{data.filters.classes.map(value => <option key={value}>{value}</option>)}</select><select aria-label="Tag" value={filters.tag} onChange={event => onChange({ tag: event.target.value })}><option value="">Tous les tags</option>{data.filters.tags.map(value => <option key={value}>{value}</option>)}</select>{showEffect && <select aria-label="Effet ennemi" value={filters.effect} onChange={event => onChange({ effect: event.target.value })}><option value="">Tous les effets ennemis</option>{data.filters.effects.map(value => <option key={value}>{value}</option>)}</select>}{children}</div>
}

const counterBadge = (counter: EnemyCounter) => `${counter.nature === 'ignore' ? 'ignore' : counter.complete ? 'réduit complètement' : counter.stacks != null ? `réduit ${counter.stacks} stack${counter.stacks === 1 ? '' : 's'}` : `réduit ${counter.turns} tour${counter.turns === 1 ? '' : 's'}`} · ${counter.source === 'captain' ? 'capitaine' : counter.source}`

function CharacterGrid({ units, scores, beneficiaries, counterEffect, onSelect, action }: { units: Unit[]; scores?: Map<Id, number>; beneficiaries?: Set<Id>; counterEffect?: string; onSelect?: (unit: Unit) => void; action?: (unit: Unit) => React.ReactNode }) {
  return <div className="character-grid">{units.map(unit => <article key={unit.id} className={`unit-tile ${onSelect ? 'selectable' : ''} ${beneficiaries?.has(unit.id) ? 'beneficiary' : ''}`} onClick={() => onSelect?.(unit)}><div className="portrait-wrap"><img src={portrait(unit.id)} alt="" loading="lazy" width="72" height="72" />{scores?.get(unit.id) ? <span className="score">+{scores.get(unit.id)}</span> : null}{action?.(unit)}</div><div className="type-row">{unit.types.map(value => <span className={`type ${value}`} key={value}>{value}</span>)}</div><b title={unit.name}>{unit.name}</b><small>#{unit.id} · coût {unit.cost}</small>{counterEffect && <div className="counter-badges">{unit.counters.filter(counter => counter.effect === counterEffect).map((counter, index) => <span className={`counter-badge ${counter.nature}`} key={`${counter.effect}-${counter.source}-${counter.turns ?? counter.stacks ?? 0}-${counter.complete ? 'complete' : ''}-${index}`}>{counterBadge(counter)}</span>)}</div>}</article>)}</div>
}

function TeamBuilder({ team, boxIds, cap, onBack, onChange }: { team: Team; boxIds: Id[]; cap: number; onBack: () => void; onChange: (team: Team) => void }) {
  const [activeSlot, setActiveSlot] = useState(0)
  const [supportFor, setSupportFor] = useState<number | null>(null)
  const [filters, setFilters] = useState<UnitFilters>(emptyFilters)
  const crew = team.slots.flatMap(id => id ? [data.units[id]] : [])
  const supports = team.type === 'pve' ? Object.values(team.supports).map(id => data.units[id]).filter(Boolean) : []
  const conditions = useMemo(() => team.type === 'pve' ? mergeConditions(crew) : mergeRumbleConditions(crew), [team, crew])
  const checkedEntries = conditions.filter(item => team.checkedConditions.includes(item.key))
  const stateForEntry = (item: MergedCondition) => {
    const carrierSupports = team.type === 'pve' ? team.slots.flatMap((id, index) => id && item.carriers.includes(data.units[id].name) && team.supports[index] ? [data.units[team.supports[index]]] : []) : []
    return conditionState(item.condition, crew, item.condition.family === 'member' ? carrierSupports : supports, team.slots[0] ? data.units[team.slots[0]] : undefined)
  }
  const checked = checkedEntries.filter(item => item.condition.negative || item.condition.comparator === 'exact' || !stateForEntry(item).done).map(item => item.condition)
  const currentCost = teamCost(team, data.units)
  const modifierBeneficiaries = new Set<Id>(team.type === 'pvp' ? boxIds.filter(id => team.modifiers.some(modifier => matchesModifier(data.units[id], modifier.targetKind, modifier.target))) : [])
  const scored = boxIds.map(id => data.units[id]).filter(Boolean).filter(unit => matchesUnitFilters(unit, filters)).map(unit => ({ unit, ...candidateProgress(unit, crew, checked) })).filter(item => !item.violates && (!checked.some(condition => !condition.negative && !conditionState(condition, crew).done) || item.score > 0)).sort((a, b) => b.score - a.score || byDescendingId(a.unit, b.unit))
  const scores = new Map(scored.map(item => [item.unit.id, item.score]))

  const select = (unit: Unit) => {
    const selectingSupport = team.type === 'pve' && supportFor !== null
    const otherCrew = team.slots.flatMap((id, index) => {
      if (!id || (!selectingSupport && index === activeSlot)) return []
      const isCaptainFriendPair = team.type === 'pve' && !selectingSupport && ((activeSlot === 0 && index === 1) || (activeSlot === 1 && index === 0))
      return isCaptainFriendPair && id === unit.id ? [] : [data.units[id]]
    })
    const otherSupports = team.type === 'pve' ? Object.entries(team.supports).flatMap(([index, id]) => selectingSupport && Number(index) === supportFor ? [] : [data.units[id]]) : []
    const otherOccupants = [...otherCrew, ...otherSupports]
    if (hasFamilyConflict(unit, otherOccupants)) return alert('Doublon interdit : ce personnage partage une famille avec un membre ou support déjà placé.')
    if (team.type === 'pve' && supportFor !== null) {
      const next = { ...team, supports: { ...team.supports, [supportFor]: unit.id } }
      if (teamCost(next, data.units) > cap) return alert(`Plafond de coût dépassé (${cap}).`)
      onChange(next); setSupportFor(null); return
    }
    if (team.type === 'pvp' && !unit.rumble) return alert('Cette unité ne possède pas de kit Rumble indexé.')
    const slots = [...team.slots]; slots[activeSlot] = unit.id
    const next = { ...team, slots } as Team
    if (teamCost(next, data.units) > cap) return alert(`Plafond de coût dépassé (${cap}).`)
    onChange(next)
  }
  const toggleCondition = (key: string) => onChange({ ...team, checkedConditions: team.checkedConditions.includes(key) ? team.checkedConditions.filter(item => item !== key) : [...team.checkedConditions, key] })
  return <main className="builder-page">
    <div className="builder-head"><button className="back" onClick={onBack}><ChevronLeft size={18} /> Équipes</button><input aria-label="Nom de l’équipe" value={team.name} onChange={event => onChange({ ...team, name: event.target.value })} /><span className={`mode-label ${team.type}`}>{team.type === 'pve' ? 'PVE' : 'PIRATE RUMBLE'}</span>{team.type === 'pvp' && <select value={team.mode} onChange={event => onChange({ ...team, mode: event.target.value as PvpTeam['mode'] })}><option value="normal">Rumble normal</option><option value="assault">Assault Rumble</option></select>}<span className={`cost-head ${currentCost > cap ? 'over' : ''}`}>{currentCost} / {cap}</span><span className="saved"><Save size={14} /> Sauvegardé localement</span></div>
    <div className="builder-workspace">
      <aside className="conditions-panel"><p className="panel-title">Conditions de composition</p><h2>Priorités de recherche</h2><p className="panel-help">Cochez les conditions à remplir. Les candidats sont filtrés et classés automatiquement.</p>{conditions.length ? <div className="condition-list">{conditions.map(item => {
        const baseState = stateForEntry(item)
        const captainMatchesCarrier = team.slots[0] ? item.carriers.includes(data.units[team.slots[0]].name) : false
        const state = item.condition.family === 'captain' ? { current: captainMatchesCarrier ? 1 : 0, target: 1, done: captainMatchesCarrier, label: captainMatchesCarrier ? '✓' : '✗' } : baseState
        return <label className={`condition ${state.done ? 'done' : ''} ${!item.condition.checkable ? 'raw' : ''}`} key={item.key}>{item.condition.checkable ? <input type="checkbox" checked={team.checkedConditions.includes(item.key)} onChange={() => toggleCondition(item.key)} /> : <span className="info-dot">i</span>}<span><small>{conditionSectionLabel(item.condition.section)} · {item.carriers.join(', ')}</small><b title={item.condition.original} aria-label={item.condition.original}>{conditionSummary(item.condition)}</b></span><em>{state.done ? <Check size={14} /> : state.label}</em></label>
      })}</div> : <Empty title="Aucune condition détectée" body="Ajoutez un porteur de condition à l’équipe pour alimenter ce panneau." />}{team.type === 'pvp' && <Modifiers team={team} onChange={onChange} />}</aside>
      <section className="candidate-panel"><div className="candidate-title"><div><p className="panel-title">Candidats de ma box</p><h2>{supportFor !== null ? `Support pour ${data.units[team.slots[supportFor]!]?.name}` : `Slot ${activeSlot + 1}`}</h2></div>{checked.length > 0 && <span className="smart-chip">Recherche intelligente active</span>}</div><Filters filters={filters} onChange={patch => setFilters(current => ({ ...current, ...patch }))} showEffect={team.type === 'pve'} /><p className="result-count">{scored.length} candidats · le score indique les conditions progressées</p><CharacterGrid units={scored.map(item => item.unit)} scores={scores} beneficiaries={modifierBeneficiaries} counterEffect={team.type === 'pve' ? filters.effect : ''} onSelect={select} /></section>
    </div>
    <TeamDock team={team} activeSlot={activeSlot} cap={cap} supportFor={supportFor} onSlot={index => { setActiveSlot(index); setSupportFor(null) }} onSupport={index => setSupportFor(supportFor === index ? null : index)} onChange={onChange} />
  </main>
}

function mergeRumbleConditions(crew: Unit[]) {
  const map = new Map<string, MergedCondition>()
  for (const unit of crew) for (const raw of unit.rumble?.conditions || []) {
    const parsed = rumbleConditionsToComposition(raw)
    const conditions = parsed.length ? parsed : [{ family: 'raw', section: 'Rumble', comparator: 'info', targets: [], original: raw.original, checkable: false } as CompositionCondition]
    for (const condition of conditions) addMergedCondition(map, condition, unit.name)
  }
  return [...map.values()]
}

function TeamDock({ team, activeSlot, cap, supportFor, onSlot, onSupport, onChange }: { team: Team; activeSlot: number; cap: number; supportFor: number | null; onSlot: (i: number) => void; onSupport: (i: number) => void; onChange: (team: Team) => void }) {
  const remove = (index: number) => { const slots = [...team.slots]; slots[index] = null; if (team.type === 'pve') { const supports = { ...team.supports }; delete supports[index]; onChange({ ...team, slots: slots as PveTeam['slots'], supports }) } else onChange({ ...team, slots }) }
  return <div className="team-dock">
    <div className="dock-slots">{team.slots.map((id, index) => {
      const unit = id ? data.units[id] : undefined
      const hasBonus = team.type === 'pvp' && unit && team.modifiers.some(modifier => matchesModifier(unit, modifier.targetKind, modifier.target))
      return <button className={`dock-slot ${activeSlot === index && supportFor === null ? 'active' : ''} ${hasBonus ? 'beneficiary' : ''}`} key={index} onClick={() => onSlot(index)}>
        <small>{team.type === 'pve' ? ['Capitaine', 'Friend', 'Membre 1', 'Membre 2', 'Membre 3', 'Membre 4'][index] : `Slot ${index + 1}`}</small>
        {unit ? <><img src={portrait(unit.id)} alt="" width="52" height="52" /><span>{unit.name}</span>{team.type === 'pvp' && <span className="rumble-meta">{unit.rumble?.rumbleType || '—'} · DEF {unit.rumble?.def ?? '—'} · SPD {unit.rumble?.spd ?? '—'} · {unit.rumble?.cost ?? 0}c</span>}<i role="button" aria-label="Retirer" onClick={event => { event.stopPropagation(); remove(index) }}><X size={12} /></i>{team.type === 'pve' && index !== 1 && <i className={`support-dot ${supportFor === index ? 'active' : ''}`} role="button" onClick={event => { event.stopPropagation(); onSupport(index) }}>{team.supports[index] ? <img src={portrait(team.supports[index])} alt="" /> : '+'}</i>}</> : <><Plus size={18} /><span>Choisir</span></>}
      </button>
    })}</div>
    {team.type === 'pve' && <label className="ship-select"><ShipWheel size={18} /><span>Bateau<small>Effets non simulés</small></span><select value={team.shipId || ''} onChange={event => onChange({ ...team, shipId: event.target.value || null })}><option value="">Aucun</option>{data.ships.map(ship => <option value={ship.id} key={ship.id}>{ship.name}</option>)}</select></label>}
    <div className={`dock-cost ${teamCost(team, data.units) > cap ? 'over' : ''}`}><b>{teamCost(team, data.units)}</b><small>/ {cap} coût</small></div>
    {team.type === 'pve' && Object.entries(team.supports).map(([index, id]) => { const supported = team.slots[Number(index)]; const verdict = supported ? supportVerdict(data.units[id].supportTarget, data.units[supported]) : 'indeterminate'; return <span className={`support-verdict ${verdict}`} title={data.units[id].supportTarget?.original} key={index}>{verdict === 'applicable' ? 'Support applicable' : verdict === 'non-applicable' ? 'Effet non applicable' : 'Cible indéterminée'}</span> })}
  </div>
}

function Modifiers({ team, onChange }: { team: PvpTeam; onChange: (team: Team) => void }) {
  const add = () => onChange({ ...team, modifiers: [...team.modifiers, { id: crypto.randomUUID(), targetKind: 'type', target: 'STR', hp: 1, atk: 1, rcv: 1, def: 1, spd: 1 }] })
  const update = (id: string, patch: Partial<PvpModifier>) => onChange({ ...team, modifiers: team.modifiers.map(item => item.id === id ? { ...item, ...patch } : item) })
  return <section className="modifiers"><div className="modifier-head"><div><p className="panel-title">Modificateurs PVP</p><h2>Bonus de saison</h2></div><button onClick={add}><Plus size={14} /> Ajouter</button></div>{team.modifiers.map(modifier => <div className="modifier" key={modifier.id}><select value={modifier.targetKind} onChange={event => update(modifier.id, { targetKind: event.target.value as PvpModifier['targetKind'] })}><option value="type">Type</option><option value="class">Classe PVE</option><option value="rumbleType">Classe Rumble</option><option value="family">Famille</option><option value="tag">Tag</option></select><input aria-label="Cible" value={modifier.target} onChange={event => update(modifier.id, { target: event.target.value })} /><div className="multipliers">{(['hp', 'atk', 'rcv', 'def', 'spd'] as const).map(stat => <label key={stat}>{stat.toUpperCase()} <input type="number" step="0.1" min="0" value={modifier[stat]} onChange={event => update(modifier.id, { [stat]: Number(event.target.value) })} /></label>)}</div><button className="danger" aria-label="Supprimer le modificateur" onClick={() => onChange({ ...team, modifiers: team.modifiers.filter(item => item.id !== modifier.id) })}><Trash2 size={14} /></button></div>)}</section>
}

function Empty({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) { return <div className="empty"><span><Swords size={24} /></span><h2>{title}</h2><p>{body}</p>{action && <button className="button primary" onClick={onAction}>{action}</button>}</div> }
