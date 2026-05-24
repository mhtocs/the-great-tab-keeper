<script setup lang="ts">
import { graveyardFaviconSrc } from '@/lib/graveyard/favicon-url'
import type { GraveyardEntry } from '@/lib/storage/schema'
import { ref } from 'vue'
import { useGraveyard } from '../composables/use-graveyard'

const { groupedEntries, hintLine, loading, restoreError, restoreEntry } = useGraveyard()

const brokenFavicons = ref(new Set<string>())

function formatTime(closedAt: number): string {
  return new Date(closedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function faviconFor(entry: GraveyardEntry): string | undefined {
  if (brokenFavicons.value.has(entry.id)) {
    return undefined
  }
  return graveyardFaviconSrc(entry)
}

function onFaviconError(entryId: string) {
  if (brokenFavicons.value.has(entryId)) {
    return
  }
  brokenFavicons.value = new Set([...brokenFavicons.value, entryId])
}
</script>

<template>
  <section class="flex h-full min-h-[28rem] flex-col px-6 pb-6 pt-4">
    <div v-if="loading" class="text-xs text-gray-500">loading…</div>

    <template v-else>
      <p class="mb-4 text-xs text-gray-500">{{ hintLine }}</p>

      <p v-if="restoreError" class="mb-3 text-xs text-red-600">{{ restoreError }}</p>

      <p v-if="groupedEntries.length === 0" class="text-xs text-gray-500">empty</p>

      <div v-else class="min-h-0 flex-1 overflow-auto">
        <table class="w-full table-fixed border-collapse text-left text-xs text-gray-600">
          <colgroup>
            <col />
            <col class="w-[5.5rem]" />
            <col class="w-[9.5rem]" />
          </colgroup>
          <thead class="text-gray-500">
            <tr>
              <th class="border-b border-gray-200 pb-2 pr-4 font-normal">tab</th>
              <th class="border-b border-gray-200 pb-2 pr-4 font-normal">time</th>
              <th class="border-b border-gray-200 pb-2 pl-4 font-normal">rule</th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="(group, groupIndex) in groupedEntries"
              :key="group.dayKey"
            >
              <tr>
                <td
                  colspan="3"
                  class="pb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase"
                  :class="groupIndex > 0 ? 'pt-4' : ''"
                >
                  {{ group.label }}
                </td>
              </tr>
              <tr
                v-for="entry in group.entries"
                :key="entry.id"
                class="align-top hover:bg-gray-50 [&>td]:border-b [&>td]:border-gray-200"
              >
                <td class="overflow-hidden py-2 pr-4">
                  <button
                    type="button"
                    class="flex w-full min-w-0 cursor-pointer items-center gap-2 text-left text-blue-600 hover:text-blue-800"
                    :title="entry.title || entry.url"
                    @click="restoreEntry(entry.id)"
                  >
                    <img
                      v-if="faviconFor(entry)"
                      :src="faviconFor(entry)"
                      alt=""
                      class="h-4 w-4 shrink-0 rounded-sm bg-gray-100 object-contain"
                      @error="onFaviconError(entry.id)"
                    />
                    <span class="min-w-0 truncate underline">{{
                      entry.title || entry.url
                    }}</span>
                  </button>
                </td>
                <td class="py-2 pr-4 whitespace-nowrap">
                  {{ formatTime(entry.closedAt) }}
                </td>
                <td class="overflow-hidden py-2 pl-4 font-mono whitespace-nowrap">
                  <span class="block truncate" :title="entry.ruleText">{{
                    entry.ruleText
                  }}</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
