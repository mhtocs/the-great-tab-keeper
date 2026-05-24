import { DEFAULT_RULES } from '@/lib/defaults/rules'
import { parseRules } from '@/lib/rules/parser'
import { readSettings, writeSettings } from '@/lib/storage/chrome-storage'
import { parseSettings } from '@/lib/storage/settings'
import type { EvaluationIntervalMinutes, Settings } from '@/lib/storage/schema'
import { useLocalStorageKeys } from './use-local-storage'
import { onMounted, ref } from 'vue'

function rulesTextFromLines(lines: string[]): string {
  return lines.join('\n')
}

function ruleLinesFromText(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function useSettings() {
  const settings = ref<Settings | null>(null)
  const rulesText = ref('')
  const validationError = ref<string | null>(null)
  const saveMessage = ref<string | null>(null)
  const running = ref(false)
  const runError = ref<string | null>(null)
  const scheduleError = ref<string | null>(null)
  const scheduleMessage = ref<string | null>(null)
  const loading = ref(true)

  async function load() {
    loading.value = true
    const stored = await readSettings()
    settings.value = stored
    rulesText.value = rulesTextFromLines(
      stored.rules.length > 0 ? stored.rules : [...DEFAULT_RULES],
    )
    loading.value = false
  }

  onMounted(() => {
    void load()
  })

  useLocalStorageKeys(['settings'], load)

  async function saveRules(): Promise<boolean> {
    validationError.value = null
    saveMessage.value = null

    if (!settings.value) {
      return false
    }

    const lines = ruleLinesFromText(rulesText.value)
    const parsed = parseRules(lines)
    if (!parsed.ok) {
      validationError.value = `line ${parsed.index + 1}: ${parsed.error}`
      return false
    }

    await writeSettings({
      ...settings.value,
      rules: lines,
    })
    saveMessage.value = 'rules saved'
    void chrome.runtime.sendMessage({ type: 'run-evaluation-cycle' }).catch(() => {})
    return true
  }

  async function runNow(): Promise<void> {
    running.value = true
    runError.value = null
    try {
      const result = (await chrome.runtime.sendMessage({
        type: 'run-evaluation-cycle',
      })) as { ok?: boolean } | undefined
      if (!result?.ok) {
        runError.value = 'cycle failed'
      }
    } catch {
      runError.value = 'background unreachable'
    } finally {
      running.value = false
    }
  }

  async function setEngineEnabled(enabled: boolean) {
    if (!settings.value) {
      return
    }
    await writeSettings({
      ...settings.value,
      engineEnabled: enabled,
    })
    settings.value = { ...settings.value, engineEnabled: enabled }
  }

  async function persistSchedule(
    patch: Partial<Pick<Settings, 'evaluationIntervalMinutes' | 'archiveRetentionDays'>>,
  ): Promise<boolean> {
    scheduleError.value = null
    scheduleMessage.value = null

    if (!settings.value) {
      return false
    }

    const candidate = { ...settings.value, ...patch }
    const parsed = parseSettings(candidate)
    if (!parsed.ok) {
      scheduleError.value = parsed.error
      return false
    }

    const previousInterval = settings.value.evaluationIntervalMinutes
    await writeSettings(parsed.settings)
    settings.value = parsed.settings
    scheduleMessage.value = 'settings saved'

    if (parsed.settings.evaluationIntervalMinutes !== previousInterval) {
      void chrome.runtime.sendMessage({ type: 'reschedule-evaluation-alarm' }).catch(() => {})
    }

    return true
  }

  async function setEvaluationIntervalMinutes(minutes: EvaluationIntervalMinutes) {
    await persistSchedule({ evaluationIntervalMinutes: minutes })
  }

  async function setArchiveRetentionDays(days: number) {
    await persistSchedule({ archiveRetentionDays: days })
  }

  return {
    settings,
    rulesText,
    validationError,
    saveMessage,
    running,
    runError,
    scheduleError,
    scheduleMessage,
    loading,
    saveRules,
    runNow,
    setEngineEnabled,
    setEvaluationIntervalMinutes,
    setArchiveRetentionDays,
  }
}
