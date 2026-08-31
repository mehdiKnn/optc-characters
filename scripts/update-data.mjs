import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig } from './data-utils.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const config = await loadConfig(root)
const response = await fetch(`https://api.github.com/repos/${config.repository}/commits/master`, { headers: { Accept: 'application/vnd.github+json' } })
if (!response.ok) throw new Error(`GitHub: HTTP ${response.status}`)
const latest = (await response.json()).sha
if (latest === config.sha) {
  console.log('Les données sont déjà à jour.')
  process.exit(0)
}
config.sha = latest
await fs.writeFile(path.join(root, 'data-source.json'), `${JSON.stringify(config, null, 2)}\n`)
console.log(`SHA optc-db avancé vers ${latest}. Lancez npm run data:build pour vérifier la couverture.`)
