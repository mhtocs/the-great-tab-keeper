import type { LifecycleAction } from '../storage/schema'

export type TabSnapshot = {
  tabId: number
  url: string
  title: string
  favicon?: string
}

export type ActionContext = {
  tab: TabSnapshot
  ruleText: string
}

export type ActionResult = {
  tabRemoved: boolean
  tabDiscarded?: boolean
  graveyardEntryId?: string
}

export type ActionHandler = (ctx: ActionContext) => Promise<ActionResult>

export type ActionHandlers = Record<LifecycleAction, ActionHandler>
