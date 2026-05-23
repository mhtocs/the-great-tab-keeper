// headed chromium only — run via npm run screenshots:readme (not part of test:e2e)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initialSettings } from '../lib/defaults/seed'
import type { DevLogEntry, GraveyardEntry } from '../lib/storage/schema'
import {
  clickDashboardTab,
  expect,
  openDashboard,
  storageClear,
  storageSet,
  test,
} from './fixtures/extension'

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../docs/screenshots',
)

test.describe.configure({ mode: 'serial' })

test.beforeAll(() => {
  fs.mkdirSync(outDir, { recursive: true })
})

test('capture readme screenshots', async ({ context, dashboardUrl }) => {
  const now = Date.now()
  const hour = 60 * 60 * 1000

  const graveyard: GraveyardEntry[] = [
    {
      id: 'readme-1',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map',
      title: 'Array.prototype.map() - JavaScript | MDN',
      closedAt: now - 25 * 60 * 1000,
      action: 'close',
      ruleText: 'close inactive>2h',
    },
    {
      id: 'readme-2',
      url: 'https://github.com/pulls',
      title: 'Pull requests',
      closedAt: now - 2 * hour,
      action: 'close',
      ruleText: 'close inactive>2h',
    },
    {
      id: 'readme-3',
      url: 'http://localhost:5173/dashboard',
      title: 'vite dev server',
      closedAt: now - 5 * hour,
      action: 'close',
      ruleText: 'close inactive>30d',
    },
  ]

  const devLog: DevLogEntry[] = [
    { id: 'log-1', at: now - 3 * 60 * 1000, message: 'cycle finished · 24 tabs · 3 closed' },
    { id: 'log-2', at: now - 28 * 60 * 1000, message: 'closed · Array.prototype.map() - JavaScript | MDN' },
    { id: 'log-3', at: now - 2 * hour, message: 'closed · Pull requests' },
    { id: 'log-4', at: now - 4 * hour, message: 'alarm fired' },
  ]

  await storageClear(context)
  await storageSet(context, {
    settings: initialSettings(),
    graveyard,
    devLog,
    lastRun: { at: now - 3 * 60 * 1000, tabsEvaluated: 24, actionsTaken: 3 },
    activityCache: {},
  })

  const page = await openDashboard(context, dashboardUrl)
  await page.setViewportSize({ width: 1100, height: 820 })

  await page.locator('textarea').waitFor()
  await page.locator('header ul').waitFor()
  await page.screenshot({ path: path.join(outDir, 'rules.png') })

  await clickDashboardTab(page, 'graveyard')
  await page.getByRole('button', { name: 'Pull requests' }).waitFor()
  await page.screenshot({ path: path.join(outDir, 'graveyard.png') })

  await clickDashboardTab(page, 'logs')
  await page.locator('pre').waitFor()
  await expect(page.locator('pre')).toContainText('cycle finished')
  await page.screenshot({ path: path.join(outDir, 'logs.png') })

  await clickDashboardTab(page, 'settings')
  await page.locator('select').waitFor()
  await page.screenshot({ path: path.join(outDir, 'settings.png') })

  await page.close()
})
