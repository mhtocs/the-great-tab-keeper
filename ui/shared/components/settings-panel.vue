<script setup lang="ts">
import { MIN_ARCHIVE_RETENTION_DAYS } from '@/lib/archive/store'
import {
  EVALUATION_INTERVALS,
  type EvaluationIntervalMinutes,
} from '@/lib/storage/schema'
import { useSettings } from '../composables/use-settings'

const {
  settings,
  loading,
  scheduleError,
  scheduleMessage,
  setEvaluationIntervalMinutes,
  setArchiveRetentionDays,
} = useSettings()

function onIntervalChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value)
  void setEvaluationIntervalMinutes(value as EvaluationIntervalMinutes)
}

function onRetentionBlur(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  void setArchiveRetentionDays(value)
}
</script>

<template>
  <section class="space-y-6 p-6">
    <div v-if="loading" class="text-sm text-gray-500">loading…</div>

    <template v-else-if="settings">
      <p class="text-sm text-gray-600">schedule and archive retention. changes save immediately.</p>

      <div class="grid max-w-md gap-4">
        <label class="block text-sm text-gray-700">
          evaluation interval
          <select
            class="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
            :value="settings.evaluationIntervalMinutes"
            @change="onIntervalChange"
          >
            <option v-for="minutes in EVALUATION_INTERVALS" :key="minutes" :value="minutes">
              every {{ minutes }} {{ minutes === 1 ? 'minute' : 'minutes' }}
            </option>
          </select>
        </label>

        <label class="block text-sm text-gray-700">
          archive retention (days)
          <input
            type="number"
            class="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
            :min="MIN_ARCHIVE_RETENTION_DAYS"
            :value="settings.archiveRetentionDays"
            @change="onRetentionBlur"
          />
          <span class="mt-1 block text-xs text-gray-500">minimum {{ MIN_ARCHIVE_RETENTION_DAYS }} days</span>
        </label>
      </div>

      <p v-if="scheduleError" class="text-sm text-red-600">{{ scheduleError }}</p>
      <p v-else-if="scheduleMessage" class="text-sm text-green-700">{{ scheduleMessage }}</p>
    </template>
  </section>
</template>
