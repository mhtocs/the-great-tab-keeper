<script setup lang="ts">
import { useSettings } from '../composables/use-settings'

const {
  settings,
  rulesText,
  validationError,
  saveMessage,
  running,
  runError,
  loading,
  saveRules,
  runNow,
  setEngineEnabled,
} = useSettings()
</script>

<template>
  <section class="space-y-4 p-6">
    <div v-if="loading" class="text-sm text-gray-500">loading…</div>

    <template v-else>
      <div class="flex items-center justify-between gap-4">
        <p class="text-sm text-gray-600">one rule per line. actions: keep, archive, discard, suspend.</p>
        <label
          v-if="settings"
          class="flex shrink-0 items-center gap-3 text-sm text-gray-700"
        >
          engine
          <button
            type="button"
            class="flex h-6 w-12 cursor-pointer items-center rounded-full p-1 transition-colors duration-300"
            :class="settings.engineEnabled ? 'bg-green-500' : 'bg-gray-300'"
            @click="setEngineEnabled(!settings.engineEnabled)"
          >
            <span
              class="h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300"
              :class="settings.engineEnabled ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </label>
      </div>

      <textarea
        v-model="rulesText"
        rows="14"
        spellcheck="false"
        class="w-full resize-y rounded border border-gray-300 bg-white p-3 font-mono text-sm leading-relaxed text-gray-800 focus:border-blue-400 focus:outline-none"
        placeholder="keep pinned=true"
      />

      <p v-if="validationError" class="text-sm text-red-600">{{ validationError }}</p>
      <p v-else-if="saveMessage" class="text-sm text-green-700">{{ saveMessage }}</p>
      <p v-if="runError" class="text-sm text-red-600">{{ runError }}</p>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
          @click="saveRules"
        >
          save rules
        </button>
        <button
          type="button"
          class="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="running || !settings?.engineEnabled"
          @click="runNow"
        >
          {{ running ? 'running…' : 'run now' }}
        </button>
      </div>
    </template>
  </section>
</template>
