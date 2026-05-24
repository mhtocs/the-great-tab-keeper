// headed chromium only, run via npm run screenshots:readme (not part of test:e2e)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initialSettings } from '../lib/defaults/seed'
import type { DevLogEntry, ArchiveEntry } from '../lib/storage/schema'
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

// keep / archive / discard / suspend + url / inactive, copied from lib + e2e tests
const readmeRules = [
  'keep pinned=true', // seed.test, action-handlers.test
  'keep url=docs.google.com', // evaluator.test
  'archive inactive>2h', // evaluator.test, extension.spec
  'archive inactive>10m url=docs.google.com', // evaluator.test
  'discard inactive>7d', // action-handlers.test
  'suspend inactive>2h url=journalclub.io',
] as const

const readmeSuspendedTabId = 9001
const readmeSuspendedEntry = {
  url: 'https://journalclub.io/episodes',
  title: 'The Episode Archive',
  suspendedAt: Date.now(),
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(() => {
  fs.mkdirSync(outDir, { recursive: true })
})

test('capture readme screenshots', async ({ context, dashboardUrl, extensionId }) => {
  const now = Date.now()
  const hour = 60 * 60 * 1000

  const archive: ArchiveEntry[] = [
    {
      id: 'readme-1',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map',
      title: 'Array.prototype.map() - JavaScript | MDN',
      archivedAt: now - 25 * 60 * 1000,
      action: 'archive',
      ruleText: 'archive inactive>2h',
    },
    {
      id: 'readme-2',
      url: 'https://github.com/pulls',
      title: 'Pull requests',
      archivedAt: now - 2 * hour,
      action: 'archive',
      ruleText: 'archive inactive>2h',
    },
    {
      id: 'readme-3',
      url: 'http://localhost:5173/dashboard',
      title: 'vite dev server',
      archivedAt: now - 5 * hour,
      action: 'archive',
      ruleText: 'archive inactive>10m url=docs.google.com',
    },
  ]

  const devLog: DevLogEntry[] = [
    {
      id: 'log-1',
      at: now - 3 * 60 * 1000,
      message: 'cycle finished, 24 evaluated, 3 archived, 1 suspended',
    },
    { id: 'log-2', at: now - 28 * 60 * 1000, message: 'archived, Array.prototype.map() - JavaScript | MDN' },
    { id: 'log-3', at: now - 2 * hour, message: 'suspended, The Episode Archive' },
    { id: 'log-4', at: now - 2 * hour, message: 'archived, Pull requests' },
    { id: 'log-5', at: now - 4 * hour, message: 'alarm fired' },
  ]

  await storageClear(context)
  await storageSet(context, {
    settings: { ...initialSettings(), rules: [...readmeRules] },
    archive,
    devLog,
    lastRun: { at: now - 3 * 60 * 1000, tabsEvaluated: 24, actionsTaken: 4 },
    activityCache: {},
  })

  const serviceWorker = await getExtensionServiceWorker(context)
  await serviceWorker.evaluate(
    async (payload) => {
      await chrome.storage.session.set({
        suspendedTabs: { [String(payload.tabId)]: payload.entry },
      })
    },
    { tabId: readmeSuspendedTabId, entry: { ...readmeSuspendedEntry, suspendedAt: now - 2 * hour } },
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

  await clickDashboardTab(page, 'archive')
  await page.getByRole('button', { name: 'Pull requests' }).waitFor()
  await page.screenshot({ path: path.join(outDir, 'archive.png') })

  await clickDashboardTab(page, 'logs')
  await page.locator('pre').waitFor()
  await expect(page.locator('pre')).toContainText('cycle finished')
  await page.screenshot({ path: path.join(outDir, 'logs.png') })

  await clickDashboardTab(page, 'settings')
  await page.locator('select').waitFor()
  await page.screenshot({ path: path.join(outDir, 'settings.png') })

  await page.close()

  const suspendedUrl = `chrome-extension://${extensionId}/ui/suspended/index.html?tabId=${readmeSuspendedTabId}`
  const suspendedPage = await context.newPage()
  await suspendedPage.setViewportSize({ width: 1100, height: 820 })
  await suspendedPage.goto(suspendedUrl)
  await suspendedPage.getByText('suspended by the great tab keeper').waitFor()
  await expect(suspendedPage.getByText('The Episode Archive')).toBeVisible()
  await expect(suspendedPage.getByText('https://journalclub.io/episodes')).toBeVisible()
  await suspendedPage.screenshot({ path: path.join(outDir, 'suspend.png') })
  await suspendedPage.close()
})
