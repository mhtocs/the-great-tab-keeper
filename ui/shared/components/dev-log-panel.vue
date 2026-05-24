<script setup lang="ts">
import { DEV_LOG_MAX_ENTRIES } from '@/lib/logs/dev-log'
import { useDevLog } from '../composables/use-dev-log'

const { logText, isEmpty, loading } = useDevLog()
</script>

<template>
  <section class="min-h-[28rem] space-y-3 px-6 pb-6 pt-4">
    <p class="text-xs text-gray-500">dev log (max {{ DEV_LOG_MAX_ENTRIES }}, oldest first)</p>

    <div v-if="loading" class="text-xs text-gray-500">loading…</div>

    <template v-else>
      <pre
        v-if="!isEmpty"
        class="rounded border border-gray-800 bg-gray-950 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-gray-300"
        >{{ logText }}</pre
      >

      <p v-else class="font-mono text-xs text-gray-500"># empty</p>
    </template>
  </section>
</template>
