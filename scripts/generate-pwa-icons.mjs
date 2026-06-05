import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'

const OUTPUT_DIR = 'public/icons'

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

// VaultOS icon: dark rounded square (#0a0a0a) + green "V" stroke (#00C896)
const svgTemplate = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" rx="100" fill="#0a0a0a"/>
  <polyline
    points="88,120 256,390 424,120"
    fill="none"
    stroke="#00C896"
    stroke-width="70"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
`

const sizes = [192, 512]

for (const size of sizes) {
  await sharp(Buffer.from(svgTemplate(size)))
    .resize(size, size)
    .png()
    .toFile(`${OUTPUT_DIR}/pwa-${size}x${size}.png`)
  console.log(`✓ pwa-${size}x${size}.png`)
}
