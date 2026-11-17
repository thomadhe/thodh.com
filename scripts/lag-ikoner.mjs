// Makes the site's raster icons from app/icon.svg: app/favicon.ico (16, 32 and 48 px, PNG inside) and
// app/apple-icon.png (180 px). Run with `node scripts/lag-ikoner.mjs` after changing the SVG.
import { readFileSync, writeFileSync } from "node:fs"
import sharp from "sharp"

const svg = readFileSync("app/icon.svg")
const png = (storrelse) => sharp(svg, { density: 72 * Math.ceil(storrelse / 64) * 4 }).resize(storrelse, storrelse).png().toBuffer()

const storrelser = [16, 32, 48]
const bilder = await Promise.all(storrelser.map(png))

// ICO: a 6-byte header, one 16-byte entry per image, then the PNG files as they are.
const hode = Buffer.alloc(6)
hode.writeUInt16LE(0, 0)
hode.writeUInt16LE(1, 2)
hode.writeUInt16LE(bilder.length, 4)
let forskyvning = 6 + 16 * bilder.length
const oppforinger = bilder.map((bilde, i) => {
  const s = storrelser[i]
  const o = Buffer.alloc(16)
  o.writeUInt8(s === 256 ? 0 : s, 0)
  o.writeUInt8(s === 256 ? 0 : s, 1)
  o.writeUInt16LE(1, 4)
  o.writeUInt16LE(32, 6)
  o.writeUInt32LE(bilde.length, 8)
  o.writeUInt32LE(forskyvning, 12)
  forskyvning += bilde.length
  return o
})
writeFileSync("app/favicon.ico", Buffer.concat([hode, ...oppforinger, ...bilder]))

// iOS draws its own rounded corners, so the apple icon fills the square with the sky.
const fylt = readFileSync("app/icon.svg", "utf8").replace('rx="15" fill="url(#himmel)"', 'fill="url(#himmel)"')
writeFileSync("app/apple-icon.png", await sharp(Buffer.from(fylt), { density: 72 * 12 }).resize(180, 180).png().toBuffer())
console.log("app/favicon.ico og app/apple-icon.png er laget")
