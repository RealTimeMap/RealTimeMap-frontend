import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getIcons } from '@iconify/utils'

const require = createRequire(import.meta.url)
const scriptDir = dirname(fileURLToPath(import.meta.url))
const srcDir = join(scriptDir, '..', 'src')
const jsonDir = join(dirname(require.resolve('@iconify/json/package.json')), 'json')

const files = readdirSync(srcDir, { recursive: true })
  .filter(f => typeof f === 'string' && /\.(?:vue|ts|tsx|js)$/.test(f))

const tokenRe = /['"`]([a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*)['"`]/g
const byPrefix = new Map()

for (const rel of files) {
  const content = readFileSync(join(srcDir, rel), 'utf8')
  let m = tokenRe.exec(content)
  while (m) {
    const [prefix, name] = m[1].split(':')
    if (!byPrefix.has(prefix))
      byPrefix.set(prefix, new Set())
    byPrefix.get(prefix).add(name)
    m = tokenRe.exec(content)
  }
}

const subsets = []
let total = 0

for (const [prefix, names] of [...byPrefix].sort()) {
  let collection
  try {
    collection = JSON.parse(readFileSync(join(jsonDir, `${prefix}.json`), 'utf8'))
  }
  catch {
    continue
  }

  const subset = getIcons(collection, [...names])
  if (!subset)
    continue

  const found = Object.keys(subset.icons).length
  const missing = [...names].filter(n => !subset.icons[n] && !(subset.aliases && subset.aliases[n]))
  total += found
  subsets.push(subset)
  console.log(`  ${prefix}: ${found}/${names.size}${missing.length ? ` (нет: ${missing.join(', ')})` : ''}`)
}

const out = `// АВТО-СГЕНЕРИРОВАНО scripts/build-icons.mjs — не редактировать вручную.
// Офлайн-бандл только используемых иконок (регистрируются без Iconify API).
/* eslint-disable */
import { addCollection } from '@iconify/vue'

const collections = ${JSON.stringify(subsets)} as unknown as Parameters<typeof addCollection>[0][]

collections.forEach(c => addCollection(c))

export {}
`

const genDir = join(srcDir, 'generated')
mkdirSync(genDir, { recursive: true })
writeFileSync(join(genDir, 'icons.ts'), out)

console.log(`\nИконок в офлайн-бандле: ${total} (из ${subsets.length} коллекций)`)
