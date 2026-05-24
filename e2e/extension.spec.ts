import { DEFAULT_RULES } from '../lib/defaults/rules'
import type { DevLogEntry, ArchiveEntry, Settings } from '../lib/storage/schema'
import { initialSettings } from '../lib/defaults/seed'
import {
  clickDashboardTab,
  clickEngineToggle,
  expect,
  getEvaluationAlarmPeriodMinutes,
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
    archive: [],
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

test('restores archive entry from dashboard', async ({ context, dashboardUrl }) => {
  const entry: ArchiveEntry = {
    id: 'e2e-archive-1',
    url: 'https://example.com/e2e-restore',
    title: 'e2e restore me',
    archivedAt: Date.now(),
    action: 'archive',
    ruleText: 'archive inactive>1h',
  }
  await storageSet(context, { archive: [entry] })

  const page = await openDashboard(context, dashboardUrl)
  await clickDashboardTab(page, 'archive')
  await page.getByRole('button', { name: 'e2e restore me' }).click()

  await expect
    .poll(async () => {
      const stored = (await storageGet(context, 'archive')) as { archive: ArchiveEntry[] }
      return stored.archive?.length ?? -1
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
      rules: ['archive url=example.com'],
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

test('loads default rules in the editor', async ({ context, dashboardUrl }) => {
  const page = await openDashboard(context, dashboardUrl)
  const textarea = page.locator('textarea')
  await textarea.waitFor()

  for (const line of DEFAULT_RULES) {
    await expect(textarea).toHaveValue(new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  await page.close()
})

test('saves valid rules and persists to storage', async ({ context, dashboardUrl }) => {
  const page = await openDashboard(context, dashboardUrl)
  await page.locator('textarea').waitFor()

  const rules = ['keep pinned=true', 'archive inactive>1h']
  await page.locator('textarea').fill(rules.join('\n'))
  await page.getByRole('button', { name: 'save rules' }).click()

  await expect(page.getByText('rules saved')).toBeVisible()

  await expect
    .poll(async () => {
      const stored = (await storageGet(context, 'settings')) as { settings: Settings }
      return stored.settings.rules
    })
    .toEqual(rules)

  await page.close()
})

test('engine toggle persists to storage', async ({ context, dashboardUrl }) => {
  const page = await openDashboard(context, dashboardUrl)
  await page.locator('textarea').waitFor()

  await clickEngineToggle(page)

  await expect
    .poll(async () => {
      const stored = (await storageGet(context, 'settings')) as { settings: Settings }
      return stored.settings.engineEnabled
    })
    .toBe(false)

  await page.close()
})

test('run now writes a cycle line to dev log', async ({ context, dashboardUrl }) => {
  const page = await openDashboard(context, dashboardUrl)
  await page.locator('textarea').waitFor()

  await page.getByRole('button', { name: 'run now' }).click()

  await expect
    .poll(async () => {
      const stored = (await storageGet(context, 'devLog')) as { devLog: DevLogEntry[] }
      return stored.devLog?.some((line) => line.message.includes('cycle finished')) ?? false
    })
    .toBe(true)

  await clickDashboardTab(page, 'logs')
  await expect(page.locator('pre')).toContainText('cycle finished')
  await page.close()
})

test('header shows last run stats after run now', async ({ context, dashboardUrl }) => {
  const page = await openDashboard(context, dashboardUrl)
  await page.locator('textarea').waitFor()

  await page.getByRole('button', { name: 'run now' }).click()

  await expect(page.locator('header ul')).toContainText(/last run:/i)
  await expect(page.locator('header ul')).toContainText(/evaluated/i)

  await page.close()
})

test('archive tab shows empty state', async ({ context, dashboardUrl }) => {
  const page = await openDashboard(context, dashboardUrl)
  await clickDashboardTab(page, 'archive')
  await expect(page.getByText('empty', { exact: true })).toBeVisible()
  await page.close()
})

test('evaluation archives matching tab and adds archive entry', async ({
  context,
  dashboardUrl,
}) => {
  await storageSet(context, {
    settings: {
      ...initialSettings(),
      rules: ['archive url=example.com/e2e-victim'],
    },
  })

  const victim = await context.newPage()
  await victim.goto('https://example.com/e2e-victim')

  await runEvaluationCycle(context, dashboardUrl)

  await expect.poll(() => victim.isClosed()).toBe(true)

  await expect
    .poll(async () => {
      const stored = (await storageGet(context, 'archive')) as { archive: ArchiveEntry[] }
      return stored.archive?.some((entry) => entry.url.includes('e2e-victim')) ?? false
    })
    .toBe(true)
})

test('settings interval change reschedules evaluation alarm', async ({ context, dashboardUrl }) => {
  const page = await openDashboard(context, dashboardUrl)
  await clickDashboardTab(page, 'settings')
  await page.locator('select').waitFor()

  await page.locator('select').selectOption('15')
  await expect(page.getByText('settings saved')).toBeVisible()

  await expect
    .poll(() => getEvaluationAlarmPeriodMinutes(context))
    .toBe(15)

  await expect
    .poll(async () => {
      const stored = (await storageGet(context, 'settings')) as { settings: Settings }
      return stored.settings.evaluationIntervalMinutes
    })
    .toBe(15)

  await page.close()
})

test('restore writes a line to dev log', async ({ context, dashboardUrl }) => {
  const entry: ArchiveEntry = {
    id: 'e2e-log-restore',
    url: 'https://example.com/e2e-log-restore',
    title: 'log restore target',
    archivedAt: Date.now(),
    action: 'archive',
    ruleText: 'archive inactive>1h',
  }
  await storageSet(context, { archive: [entry] })

  const page = await openDashboard(context, dashboardUrl)
  await clickDashboardTab(page, 'archive')
  await page.getByRole('button', { name: 'log restore target' }).click()

  await clickDashboardTab(page, 'logs')
  await expect(page.locator('pre')).toContainText('restored, log restore target')
  await page.close()
})
