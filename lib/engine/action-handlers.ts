import type { ArchiveEntry } from '../storage/schema'
import type { ActionContext, ActionHandlers, ActionResult } from './actions'

export type SuspendTabInput = {
  tabId: number
  url: string
  title: string
  favicon?: string
}

export type ActionHandlerDeps = {
  removeTab: (tabId: number) => Promise<void>
  suspendTab: (input: SuspendTabInput) => Promise<boolean>
  readArchive: () => Promise<ArchiveEntry[]>
  writeArchive: (entries: ArchiveEntry[]) => Promise<void>
}

async function noopKeep(): Promise<ActionResult> {
  return { tabRemoved: false }
}

async function archiveTab(
  deps: ActionHandlerDeps,
  ctx: ActionContext,
): Promise<ActionResult> {
  const entry: ArchiveEntry = {
    id: crypto.randomUUID(),
    url: ctx.tab.url,
    title: ctx.tab.title,
    favicon: ctx.tab.favicon,
    archivedAt: Date.now(),
    action: 'archive',
    ruleText: ctx.ruleText,
  }
  const archive = await deps.readArchive()
  await deps.writeArchive([...archive, entry])
  await deps.removeTab(ctx.tab.tabId)
  return { tabRemoved: true, archiveEntryId: entry.id }
}

async function discardTab(
  deps: ActionHandlerDeps,
  ctx: ActionContext,
): Promise<ActionResult> {
  await deps.removeTab(ctx.tab.tabId)
  return { tabRemoved: true }
}

async function suspendTabAction(
  deps: ActionHandlerDeps,
  ctx: ActionContext,
): Promise<ActionResult> {
  const tabDiscarded = await deps.suspendTab({
    tabId: ctx.tab.tabId,
    url: ctx.tab.url,
    title: ctx.tab.title,
    favicon: ctx.tab.favicon,
  })
  return { tabRemoved: false, tabDiscarded }
}

export function createActionHandlers(deps: ActionHandlerDeps): ActionHandlers {
  return {
    keep: noopKeep,
    archive: (ctx) => archiveTab(deps, ctx),
    discard: (ctx) => discardTab(deps, ctx),
    suspend: (ctx) => suspendTabAction(deps, ctx),
  }
}
