interface DedicatedWorkerGlobalScope {
  importScripts(...urls: string[]): void
  postMessage(message: any, transfer?: Transferable[]): void
  onmessage: ((this: DedicatedWorkerGlobalScope, ev: MessageEvent) => any) | null
  onerror: ((this: DedicatedWorkerGlobalScope, ev: ErrorEvent) => any) | null
  self: DedicatedWorkerGlobalScope
}

declare function loadPyodide(config?: { indexURL?: string }): Promise<any>

