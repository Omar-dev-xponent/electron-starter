import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)

    // Expose typed API to renderer (React) via window.electronAPI
    contextBridge.exposeInMainWorld('electronAPI', {
      print: (): Promise<void> => ipcRenderer.invoke('print'),

      savePDF: (fileName?: string): Promise<{ success: boolean; path?: string }> =>
        ipcRenderer.invoke('save-pdf', fileName)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
