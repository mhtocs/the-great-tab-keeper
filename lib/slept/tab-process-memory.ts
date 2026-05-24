export type ProcessMemoryInfo = {
  privateMemory?: number
  jsMemoryAllocated?: number
}

export type TabMemoryMeasurePorts = {
  getProcessIdForTab: (tabId: number) => Promise<number>
  getProcessInfo: (
    processIds: number[],
    includeMemory: boolean,
  ) => Promise<Record<string, ProcessMemoryInfo>>
}

function memoryFromProcess(info: ProcessMemoryInfo | undefined): number | undefined {
  if (!info) {
    return undefined
  }
  const privateMemory = info.privateMemory ?? 0
  const jsMemory = info.jsMemoryAllocated ?? 0
  const bytes = Math.max(privateMemory, jsMemory)
  if (bytes <= 0) {
    return undefined
  }
  return Math.round(bytes)
}

export async function measureTabMemoryBytes(
  tabId: number,
  ports: TabMemoryMeasurePorts,
): Promise<number | undefined> {
  try {
    const processId = await ports.getProcessIdForTab(tabId)
    const processes = await ports.getProcessInfo([processId], true)
    const info =
      processes[String(processId)] ??
      processes[processId as unknown as string]
    return memoryFromProcess(info)
  } catch {
    return undefined
  }
}
