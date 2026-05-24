import { getSuspendedEntry } from '@/lib/suspended/store'
import { readSuspendedTabs } from '@/lib/storage/chrome-session'
import { SUSPENDED_BY_LINE } from '@/lib/product-name'
import '../styles/index.css'

const params = new URLSearchParams(location.search)
const tabId = Number(params.get('tabId'))
const reloadButton = document.getElementById('reload') as HTMLButtonElement | null
const titleEl = document.getElementById('title') as HTMLParagraphElement | null
const urlEl = document.getElementById('url') as HTMLParagraphElement | null
const errorEl = document.getElementById('error') as HTMLParagraphElement | null

const bylineEl = document.querySelector('main > p.text-sm.text-gray-500')
if (bylineEl) {
  bylineEl.textContent = SUSPENDED_BY_LINE
}

function showError(message: string) {
  if (!errorEl) {
    return
  }
  errorEl.textContent = message
  errorEl.hidden = false
}

function bindReload() {
  if (!Number.isFinite(tabId) || reloadButton === null) {
    showError('invalid suspended tab')
    return
  }

  reloadButton.addEventListener('click', () => {
    reloadButton.disabled = true
    void chrome.runtime
      .sendMessage({ type: 'restore-suspended-tab', tabId })
      .then((result: { ok?: boolean; error?: string } | undefined) => {
        if (!result?.ok) {
          reloadButton.disabled = false
          showError(result?.error ?? 'reload failed')
        }
      })
      .catch(() => {
        reloadButton.disabled = false
        showError('background unreachable')
      })
  })
}

async function loadSuspendedInfo() {
  if (!Number.isFinite(tabId) || titleEl === null || urlEl === null) {
    showError('invalid suspended tab')
    if (reloadButton) {
      reloadButton.disabled = true
    }
    return
  }

  const entry = getSuspendedEntry(await readSuspendedTabs(), tabId)
  if (!entry) {
    titleEl.textContent = 'unknown tab'
    urlEl.textContent = 'no saved url for this tab'
    if (reloadButton) {
      reloadButton.disabled = true
    }
    return
  }

  const title = entry.title.trim() || 'untitled'
  titleEl.textContent = title
  titleEl.title = title
  urlEl.textContent = entry.url
  urlEl.title = entry.url
}

void loadSuspendedInfo().then(bindReload)
