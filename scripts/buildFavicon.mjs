import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(scriptDir, '..', 'public')
const master = readFileSync(join(scriptDir, 'favicon-master.svg'))

/** Растровые иконки на тёмной подложке: размер + признак маскируемой. */
const pngTargets = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'maskable-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

async function render(size) {
  return sharp(master, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 16, g: 16, b: 20, alpha: 1 } })
    .png()
    .toBuffer()
}

for (const { file, size } of pngTargets) {
  const buf = await render(size)
  writeFileSync(join(publicDir, file), buf)
  console.log(`  ${file} (${size}×${size})`)
}

const icoSizes = [16, 32, 48]
const icoPngs = await Promise.all(icoSizes.map(render))
writeFileSync(join(publicDir, 'favicon.ico'), await pngToIco(icoPngs))
console.log(`  favicon.ico (${icoSizes.join('/')})`)

console.log('\nИконки-щит сгенерированы в public/')
