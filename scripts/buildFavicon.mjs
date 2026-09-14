import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(scriptDir, '..', 'public')
const androidResDir = join(scriptDir, '..', 'android', 'app', 'src', 'main', 'res')
const master = readFileSync(join(scriptDir, 'favicon-master.svg'))
const androidForeground = readFileSync(join(scriptDir, 'android-foreground.svg'))
const androidLegacy = readFileSync(join(scriptDir, 'android-legacy.svg'))

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

/** Android mipmap: launcher-размер (legacy) и foreground-размер по dpi. */
const androidDensities = [
  { dir: 'mdpi', launcher: 48, foreground: 108 },
  { dir: 'hdpi', launcher: 72, foreground: 162 },
  { dir: 'xhdpi', launcher: 96, foreground: 216 },
  { dir: 'xxhdpi', launcher: 144, foreground: 324 },
  { dir: 'xxxhdpi', launcher: 192, foreground: 432 },
]

console.log('\nAndroid launcher-иконки:')
for (const { dir, launcher, foreground } of androidDensities) {
  const target = join(androidResDir, `mipmap-${dir}`)

  const legacy = await sharp(androidLegacy, { density: 384 })
    .resize(launcher, launcher)
    .png()
    .toBuffer()
  writeFileSync(join(target, 'ic_launcher.png'), legacy)
  writeFileSync(join(target, 'ic_launcher_round.png'), legacy)

  const fg = await sharp(androidForeground, { density: 384 })
    .resize(foreground, foreground, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  writeFileSync(join(target, 'ic_launcher_foreground.png'), fg)

  console.log(`  mipmap-${dir} (${launcher}px + fg ${foreground}px)`)
}

console.log('\nИконки-щит сгенерированы в public/ и android/…/res/mipmap-*')
