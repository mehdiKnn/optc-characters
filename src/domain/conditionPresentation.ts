import type { CompositionCondition, TargetToken } from './types'

function compactTargets(targets: TargetToken[]): string {
  const visible = targets.slice(0, 3).map(target => target.value)
  const remainder = targets.length - visible.length
  return `${visible.join(' · ')}${remainder > 0 ? ` +${remainder}` : ''}`
}

export function conditionSummary(condition: CompositionCondition): string {
  const source = condition.original || 'Condition détaillée'
  if (condition.family === 'multi') {
    const branches = condition.branches || []
    const summaries = branches.map(conditionSummary)
    if (!summaries.length || summaries.some((summary, index) => summary === branches[index].original)) return source
    return summaries.join(condition.conjunction === 'and' ? ' ET ' : ' OU ')
  }
  if (condition.family === 'captain') return 'Doit être capitaine'
  if (condition.family === 'raw') return 'Effet informatif'
  if (!condition.targets.length) return source

  const targets = compactTargets(condition.targets)
  if (condition.family === 'member') return `${targets} présent`
  if (condition.family === 'rainbow') return `1 de chaque : ${targets}`
  if (condition.family === 'scaler') return `Bonus selon le nombre de ${targets}`
  if (condition.family === 'roster') {
    const count = `${condition.count ?? 1}${condition.alternateCount !== undefined ? ` ou ${condition.alternateCount}` : ''}`
    return `${count} parmi ${targets}`
  }
  if (condition.comparator === 'less') return `≤ ${condition.count ?? 1} ${targets}`
  if (condition.comparator === 'exact') return `Exactement ${condition.count ?? 1} ${targets}`
  if (condition.comparator === 'only') return `Uniquement ${targets}`
  return `${condition.count ?? 1}+ ${targets}`
}

export function conditionSectionLabel(section: string): string {
  if (section.startsWith('captain')) return 'Capitaine'
  if (section.startsWith('superSpecial')) return 'Super spécial'
  if (section.startsWith('superTandem')) return 'Super Tandem'
  if (section.startsWith('special')) return 'Spécial'
  if (section.startsWith('potential')) return 'Potentiel'
  if (section.startsWith('sailor')) return 'Marin'
  if (section.startsWith('rush')) return 'Rush'
  return section || 'Rumble'
}
