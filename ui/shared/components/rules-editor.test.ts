import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RulesEditor from './rules-editor.vue'

const writeSettings = vi.fn().mockResolvedValue(undefined)
const readSettings = vi.fn().mockResolvedValue({
  engineEnabled: true,
  evaluationIntervalMinutes: 5,
  archiveRetentionDays: 90,
  rules: ['keep pinned=true'],
})

vi.mock('@/lib/storage/chrome-storage', () => ({
  readSettings: () => readSettings(),
  writeSettings: (s: unknown) => writeSettings(s),
}))

describe('rules-editor', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', {
      storage: {
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({ ok: true }),
      },
    })
    writeSettings.mockClear()
    readSettings.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows validation error for invalid rule on save', async () => {
    const wrapper = mount(RulesEditor)
    await vi.waitFor(() => expect(wrapper.text()).not.toContain('loading'))

    await wrapper.find('textarea').setValue('not a rule')
    await wrapper.findAll('button').find((b) => b.text() === 'save rules')!.trigger('click')

    await vi.waitFor(() => expect(wrapper.text()).toContain('line'))
    expect(writeSettings).not.toHaveBeenCalled()
  })

  it('saves valid rules to storage', async () => {
    const wrapper = mount(RulesEditor)
    await vi.waitFor(() => expect(wrapper.find('textarea').exists()).toBe(true))

    await wrapper.find('textarea').setValue('keep pinned=true\narchive inactive>2h')
    await wrapper.findAll('button').find((b) => b.text() === 'save rules')!.trigger('click')

    await vi.waitFor(() => expect(writeSettings).toHaveBeenCalled())
    expect(writeSettings.mock.calls[0]!.at(0)).toMatchObject({
      rules: ['keep pinned=true', 'archive inactive>2h'],
    })
  })
})
