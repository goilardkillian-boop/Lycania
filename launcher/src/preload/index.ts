import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/types'
import type {
  AuthState,
  InstallProgress,
  LauncherSettings,
  LaunchState,
  SignInProgress
} from '@shared/types'

function on<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_e: Electron.IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api = {
  auth: {
    getState: (): Promise<AuthState> => ipcRenderer.invoke(IPC.authGetState),
    signIn: (): Promise<AuthState> => ipcRenderer.invoke(IPC.authSignIn),
    signOut: (): Promise<void> => ipcRenderer.invoke(IPC.authSignOut),
    onState: (cb: (state: AuthState) => void) => on(IPC.authOnState, cb),
    onProgress: (cb: (progress: SignInProgress) => void) => on(IPC.authOnProgress, cb)
  },
  install: {
    start: (): Promise<{ manifest: unknown }> => ipcRenderer.invoke(IPC.installStart),
    onProgress: (cb: (progress: InstallProgress) => void) => on(IPC.installOnProgress, cb)
  },
  launch: {
    start: (): Promise<{ started: boolean }> => ipcRenderer.invoke(IPC.launchStart),
    onState: (cb: (state: LaunchState) => void) => on(IPC.launchOnState, cb),
    onLog: (cb: (line: string) => void) => on(IPC.launchOnLog, cb)
  },
  settings: {
    get: (): Promise<LauncherSettings> => ipcRenderer.invoke(IPC.settingsGet),
    set: (patch: Partial<LauncherSettings>): Promise<LauncherSettings> =>
      ipcRenderer.invoke(IPC.settingsSet, patch),
    pickGameDirectory: (): Promise<string | undefined> => ipcRenderer.invoke(IPC.settingsPickGameDirectory),
    pickJava: (): Promise<string | undefined> => ipcRenderer.invoke(IPC.settingsPickJava)
  },
  update: {
    onAvailable: (cb: (version: string) => void) => on(IPC.updateOnAvailable, cb),
    onProgress: (cb: (percent: number) => void) => on(IPC.updateOnProgress, cb),
    onDownloaded: (cb: (version: string) => void) => on(IPC.updateOnDownloaded, cb),
    installNow: (): Promise<void> => ipcRenderer.invoke(IPC.updateInstallNow)
  },
  app: {
    getVersionInfo: (): Promise<{ launcherVersion: string }> => ipcRenderer.invoke(IPC.appGetVersionInfo),
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke(IPC.appOpenExternal, url)
  }
}

export type LycaniaApi = typeof api

contextBridge.exposeInMainWorld('lycania', api)
