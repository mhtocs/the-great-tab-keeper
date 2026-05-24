// headed chromium only, run via npm run screenshots:readme (not part of test:e2e)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initialSettings } from '../lib/defaults/seed'
import type { DevLogEntry, GraveyardEntry } from '../lib/storage/schema'
import {
  clickDashboardTab,
  expect,
  getExtensionServiceWorker,
  openDashboard,
  storageClear,
  storageSet,
  test,
} from './fixtures/extension'

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../docs/screenshots',
)

// keep / close / discard / sleep + url / inactive, copied from lib + e2e tests
const readmeRules = [
  'keep pinned=true', // seed.test, action-handlers.test
  'keep url=docs.google.com', // evaluator.test
  'close inactive>2h', // evaluator.test, extension.spec
  'close inactive>10m url=docs.google.com', // evaluator.test
  'discard inactive>7d', // action-handlers.test
  'sleep inactive>2h url=journalclub.io',
] as const

const readmeSleptTabId = 9001
const readmeSleptEntry = {
  url: 'https://journalclub.io/episodes',
  title: 'The Episode Archive',
  sleptAt: Date.now(),
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(() => {
  fs.mkdirSync(outDir, { recursive: true })
})

test('capture readme screenshots', async ({ context, dashboardUrl, extensionId }) => {
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
      ruleText: 'close inactive>10m url=docs.google.com',
    },
  ]

  const devLog: DevLogEntry[] = [
    {
      id: 'log-1',
      at: now - 3 * 60 * 1000,
      message: 'cycle finished, 24 evaluated, 3 closed, 1 slept',
    },
    { id: 'log-2', at: now - 28 * 60 * 1000, message: 'closed, Array.prototype.map() - JavaScript | MDN' },
    { id: 'log-3', at: now - 2 * hour, message: 'slept, The Episode Archive' },
    { id: 'log-4', at: now - 2 * hour, message: 'closed, Pull requests' },
    { id: 'log-5', at: now - 4 * hour, message: 'alarm fired' },
  ]

  await storageClear(context)
  await storageSet(context, {
    settings: { ...initialSettings(), rules: [...readmeRules] },
    graveyard,
    devLog,
    lastRun: { at: now - 3 * 60 * 1000, tabsEvaluated: 24, actionsTaken: 4 },
    activityCache: {},
  })

  const serviceWorker = await getExtensionServiceWorker(context)
  await serviceWorker.evaluate(
    async (payload) => {
      await chrome.storage.session.set({
        sleptTabs: { [String(payload.tabId)]: payload.entry },
      })
    },
    { tabId: readmeSleptTabId, entry: { ...readmeSleptEntry, sleptAt: now - 2 * hour } },
  )

  const page = await openDashboard(context, dashboardUrl)
  await page.setViewportSize({ width: 1100, height: 820 })

  const textarea = page.locator('textarea')
  await textarea.waitFor()
  for (const line of readmeRules) {
    await expect(textarea).toHaveValue(new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
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

  const sleptUrl = `chrome-extension://${extensionId}/ui/slept/index.html?tabId=${readmeSleptTabId}`
  const sleptPage = await context.newPage()
  await sleptPage.setViewportSize({ width: 1100, height: 820 })
  await sleptPage.goto(sleptUrl)
  await sleptPage.getByText('slept by the great tab keeper').waitFor()
  await expect(sleptPage.getByText('The Episode Archive')).toBeVisible()
  await expect(sleptPage.getByText('https://journalclub.io/episodes')).toBeVisible()
  await sleptPage.screenshot({ path: path.join(outDir, 'sleep.png') })
  await sleptPage.close()
})
