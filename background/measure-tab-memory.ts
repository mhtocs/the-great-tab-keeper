import {
  measureTabMemoryBytes,
  type TabMemoryMeasurePorts,
} from '../lib/slept/tab-process-memory'

type ChromeProcessesApi = {
  getProcessIdForTab: (tabId: number) => Promise<number>
  getProcessInfo: TabMemoryMeasurePorts['getProcessInfo']
}

function chromeProcessesApi(): ChromeProcessesApi | undefined {
  const api = (chrome as unknown as { processes?: ChromeProcessesApi }).processes
  if (!api?.getProcessIdForTab || !api?.getProcessInfo) {
    return undefined
  }
  return api
}

export async function measureTabMemoryBytesFromChrome(
  tabId: number,
): Promise<number | undefined> {
  const api = chromeProcessesApi()
  if (!api) {
    return undefined
  }
  return measureTabMemoryBytes(tabId, api)
}
