import '../styles/index.css'

const params = new URLSearchParams(location.search)
const tabId = Number(params.get('tabId'))
const reloadButton = document.getElementById('reload') as HTMLButtonElement | null
const errorEl = document.getElementById('error') as HTMLParagraphElement | null

function showError(message: string) {
  if (!errorEl) {
    return
  }
  errorEl.textContent = message
  errorEl.hidden = false
}

if (!Number.isFinite(tabId) || reloadButton === null) {
  showError('invalid slept tab')
} else {
  reloadButton.addEventListener('click', () => {
    reloadButton.disabled = true
    void chrome.runtime
      .sendMessage({ type: 'restore-slept-tab', tabId })
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
