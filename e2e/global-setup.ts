import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export default function globalSetup() {
  const distManifest = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../dist/manifest.json',
  )
  if (!existsSync(distManifest)) {
    throw new Error('dist/ not found, run npm run build before npm run test:e2e')
  }
}
