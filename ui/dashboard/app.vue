<script setup lang="ts">
import { useCycleStats } from '../shared/composables/use-cycle-stats'
import DashboardTabs, { type DashboardTab } from '../shared/components/dashboard-tabs.vue'
import GraveyardTable from '../shared/components/graveyard-table.vue'
import DevLogPanel from '../shared/components/dev-log-panel.vue'
import RulesEditor from '../shared/components/rules-editor.vue'
import SettingsPanel from '../shared/components/settings-panel.vue'
import { EXTENSION_DISPLAY_NAME } from '@/lib/product-name'
import { ref } from 'vue'

const extensionName = EXTENSION_DISPLAY_NAME
const activeTab = ref<DashboardTab>('rules')
const { statLines, loading: statsLoading } = useCycleStats()
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 antialiased">
    <div class="mx-auto max-w-5xl p-4">
      <header class="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-800">{{ extensionName }}</h1>
          <p class="mt-1 max-w-md text-sm text-gray-500">
            plain-text rules to close, discard, or keep tabs on a schedule, with a
            graveyard to restore what you closed.
          </p>
        </div>
        <ul
          v-if="!statsLoading && statLines.length > 0"
          class="shrink-0 space-y-0.5 text-right text-xs text-gray-600"
        >
          <li v-for="(line, index) in statLines" :key="index">{{ line }}</li>
        </ul>
      </header>

      <div>
        <DashboardTabs :active-tab="activeTab" @change="activeTab = $event" />

        <div class="rounded-b border border-t-0 border-gray-300 bg-white">
          <RulesEditor v-if="activeTab === 'rules'" />
          <GraveyardTable v-else-if="activeTab === 'graveyard'" class="min-h-[28rem]" />
          <DevLogPanel v-else-if="activeTab === 'logs'" />
          <SettingsPanel v-else />
        </div>
      </div>
    </div>
  </div>
</template>
