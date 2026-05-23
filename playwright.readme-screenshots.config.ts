import { defineConfig } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// headed capture only — not part of npm run test:e2e
export default defineConfig({
  testDir: 'e2e',
  testMatch: 'readme-screenshots.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  globalSetup: path.join(rootDir, 'e2e/global-setup.ts'),
})
