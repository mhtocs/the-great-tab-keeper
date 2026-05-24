/// <reference types="chrome" />

import {
  test as base,
  chromium,
  type BrowserContext,
  type Page,
} from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))
export const extensionPath = path.resolve(fixtureDir, '../../dist')

export async function getExtensionServiceWorker(context: BrowserContext) {
  let [serviceWorker] = context.serviceWorkers()
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 20_000 })
  }
  return serviceWorker
}

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
  dashboardUrl: string
}>({
  // playwright fixture has no dependencies
  // eslint-disable-next-line no-empty-pattern -- required by @playwright/test
  context: async ({}, use) => {
    // mv3 extensions need a headed browser; headless shell does not load service workers reliably
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    const serviceWorker = await getExtensionServiceWorker(context)
    const id = serviceWorker.url().split('/')[2]
    if (!id) {
      throw new Error('could not parse extension id from service worker url')
    }
    await use(id)
  },
  dashboardUrl: async ({ extensionId }, use) => {
    await use(`chrome-extension://${extensionId}/ui/dashboard/index.html`)
  },
})

export { expect } from '@playwright/test'

export async function openDashboard(
  context: BrowserContext,
  dashboardUrl: string,
): Promise<Page> {
  const page = await context.newPage()
  await page.goto(dashboardUrl)
  await page.getByRole('heading', { name: 'The Great Tab Keeper' }).waitFor()
  return page
}

export async function storageGet(
  context: BrowserContext,
  keys: string | string[],
): Promise<Record<string, unknown>> {
  const serviceWorker = await getExtensionServiceWorker(context)
  return serviceWorker.evaluate(async (storageKeys) => chrome.storage.local.get(storageKeys), keys)
}

export async function storageSet(
  context: BrowserContext,
  items: Record<string, unknown>,
): Promise<void> {
  const serviceWorker = await getExtensionServiceWorker(context)
  await serviceWorker.evaluate(async (data) => {
    await chrome.storage.local.set(data)
  }, items)
}

export async function storageClear(context: BrowserContext): Promise<void> {
  const serviceWorker = await getExtensionServiceWorker(context)
  await serviceWorker.evaluate(async () => {
    await chrome.storage.local.clear()
  })
}

// trigger cycle from an extension page; sendMessage from the service worker alone fails
export async function runEvaluationCycle(
  context: BrowserContext,
  dashboardUrl: string,
): Promise<void> {
  const page =
    context.pages().find((tab) => tab.url().startsWith('chrome-extension://')) ??
    (await context.newPage())
  if (!page.url().startsWith('chrome-extension://')) {
    await page.goto(dashboardUrl)
  }
  await page.evaluate(() => chrome.runtime.sendMessage({ type: 'run-evaluation-cycle' }))
}

export async function clickDashboardTab(
  page: Page,
  tab: 'rules' | 'archive' | 'logs' | 'settings',
) {
  await page.getByRole('button', { name: tab, exact: true }).click()
}

export async function getEvaluationAlarmPeriodMinutes(
  context: BrowserContext,
): Promise<number | undefined> {
  const serviceWorker = await getExtensionServiceWorker(context)
  return serviceWorker.evaluate(async () => {
    const alarm = await chrome.alarms.get('tab-yard-evaluate')
    return alarm?.periodInMinutes
  })
}

export async function clickEngineToggle(page: Page) {
  await page.locator('label').filter({ hasText: 'engine' }).locator('button').click()
}
