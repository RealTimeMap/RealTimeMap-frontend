import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import process from 'node:process'
import { crc32, deflateSync } from 'node:zlib'

const port = Number(process.argv[2] ?? 4181)

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** Однотонный PNG size×size (RGB). */
function solidPng(size, [r, g, b]) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header.set([8, 2, 0, 0, 0], 8)
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(size * 3).map((_, i) => [r, g, b][i % 3])])
  const pixels = Buffer.concat(Array.from({ length: size }).fill(row))
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const PNG = solidPng(64, [18, 145, 90])

createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200).end('ok')
    return
  }
  res.writeHead(200, {
    'content-type': 'image/png',
    'access-control-allow-origin': '*',
    'cache-control': 'max-age=3600',
  })
  res.end(PNG)
}).listen(port)
