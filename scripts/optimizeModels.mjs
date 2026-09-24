// Оптимизация 3D-моделей достопримечательностей для карты.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const SRC_DIR = 'models-src'
const OUT_DIR = 'public/models'
const CLI = ['--yes', '@gltf-transform/cli@latest']

const STEPS = ['dedup', 'flatten', 'join', 'weld']

function gltf(args) {
  execFileSync('npx', [...CLI, ...args], { stdio: 'pipe' })
}

const models = readdirSync(SRC_DIR).filter(f => f.endsWith('.glb'))
if (models.length === 0) {
  console.error(`Нет .glb в ${SRC_DIR}`)
  process.exit(1)
}

for (const file of models) {
  const tmp = mkdtempSync(join(tmpdir(), 'glbopt-'))
  let current = join(SRC_DIR, file)

  for (let i = 0; i < STEPS.length; i++) {
    const next = i === STEPS.length - 1
      ? join(OUT_DIR, file)
      : join(tmp, `s${i}.glb`)
    gltf([STEPS[i], current, next])
    current = next
  }

  rmSync(tmp, { recursive: true, force: true })
  console.log(`✔ ${file}`)
}

console.log(`\nГотово: ${models.length} моделей оптимизировано → ${OUT_DIR}`)
