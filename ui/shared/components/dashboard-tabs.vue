<script setup lang="ts">
export type DashboardTab = 'rules' | 'archive' | 'logs' | 'settings'

defineProps<{
  activeTab: DashboardTab
}>()

const emit = defineEmits<{
  change: [tab: DashboardTab]
}>()

const tabs: { id: DashboardTab; label: string }[] = [
  { id: 'rules', label: 'rules' },
  { id: 'archive', label: 'archive' },
  { id: 'logs', label: 'logs' },
  { id: 'settings', label: 'settings' },
]
</script>

<template>
  <div class="relative flex border-b border-gray-300">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="cursor-pointer rounded-t px-4 py-2 text-sm font-medium transition-colors focus:outline-none"
      :class="
        activeTab === tab.id
          ? '-mb-px z-10 border border-b-0 border-gray-300 bg-white text-gray-700'
          : 'text-gray-400 hover:text-gray-600'
      "
      @click="emit('change', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
