import type { GraveyardEntry, Settings } from '../lib/storage/schema'
import { initialSettings } from '../lib/defaults/seed'
import {
  clickDashboardTab,
  expect,
  openDashboard,
  runEvaluationCycle,
  storageClear,
  storageGet,
  storageSet,
  test,
} from './fixtures/extension'

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ context }) => {
  await storageClear(context)
  await storageSet(context, {
    settings: initialSettings(),
    graveyard: [],
    devLog: [],
    activityCache: {},
  })
})

test('rejects invalid rules on save without persisting', async ({ context, dashboardUrl }) => {
  const page = await openDashboard(context, dashboardUrl)
  await page.locator('textarea').waitFor()
  const before = (await storageGet(context, 'settings')) as { settings: Settings }

  await page.locator('textarea').fill('not a valid rule')
  await page.getByRole('button', { name: 'save rules' }).click()

  await expect(page.getByText(/line \d+:/)).toBeVisible()

  await expect
    .poll(async () => {
      const stored = (await storageGet(context, 'settings')) as { settings: Settings }
      return stored.settings.rules
    })
    .toEqual(before.settings.rules)

  await page.close()
})

test('restores graveyard entry from dashboard', async ({ context, dashboardUrl }) => {
  const entry: GraveyardEntry = {
    id: 'e2e-graveyard-1',
    url: 'https://example.com/e2e-restore',
    title: 'e2e restore me',
    closedAt: Date.now(),
    action: 'close',
    ruleText: 'close inactive>1h',
  }
  await storageSet(context, { graveyard: [entry] })

  const page = await openDashboard(context, dashboardUrl)
  await clickDashboardTab(page, 'graveyard')
  await page.getByRole('button', { name: 'e2e restore me' }).click()

  await expect
    .poll(async () => {
      const stored = (await storageGet(context, 'graveyard')) as { graveyard: GraveyardEntry[] }
      return stored.graveyard?.length ?? -1
    })
    .toBe(0)

  await expect
    .poll(() =>
      context.pages().some((tab) => tab.url().includes('example.com/e2e-restore')),
    )
    .toBe(true)

  await page.close()
})

test('engine off prevents evaluation from closing tabs', async ({ context, dashboardUrl }) => {
  await storageSet(context, {
    settings: {
      ...initialSettings(),
      engineEnabled: false,
      rules: ['close url=example.com'],
    },
  })

  const target = await context.newPage()
  await target.goto('https://example.com/')

  await runEvaluationCycle(context, dashboardUrl)

  await expect(target).toHaveURL(/example\.com/)
  expect(context.pages().some((tab) => tab.url().includes('example.com'))).toBe(true)

  const dashboard = await openDashboard(context, dashboardUrl)
  await expect(dashboard.getByRole('button', { name: 'run now' })).toBeDisabled()
  await dashboard.close()
  await target.close()
})

test('logs tab shows dev log lines from storage', async ({ context, dashboardUrl }) => {
  await storageSet(context, {
    devLog: [{ id: 'e2e-log-1', at: Date.now(), message: 'alarm fired' }],
  })

  const page = await openDashboard(context, dashboardUrl)
  await clickDashboardTab(page, 'logs')
  await expect(page.locator('pre')).toContainText('alarm fired')
  await page.close()
})
