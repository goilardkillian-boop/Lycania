/// <reference types="vite/client" />

import type {
  AuthState,
  InstallProgress,
  LauncherSettings,
  LaunchState,
  PackManifest,
  SignInProgress
} from '@shared/types'

declare global {
  interface Window {
    lycania: {
      auth: {
        getState: () => Promise<AuthState>
        signIn: () => Promise<AuthState>
        signOut: () => Promise<void>
        onState: (cb: (state: AuthState) => void) => () => void
        onProgress: (cb: (progress: SignInProgress) => void) => () => void
      }
      install: {
        start: () => Promise<{ manifest: PackManifest }>
        onProgress: (cb: (progress: InstallProgress) => void) => () => void
      }
      launch: {
        start: () => Promise<{ started: boolean }>
        onState: (cb: (state: LaunchState) => void) => () => void
        onLog: (cb: (line: string) => void) => () => void
      }
      settings: {
        get: () => Promise<LauncherSettings>
        set: (patch: Partial<LauncherSettings>) => Promise<LauncherSettings>
        pickGameDirectory: () => Promise<string | undefined>
        pickJava: () => Promise<string | undefined>
      }
      update: {
        onAvailable: (cb: (version: string) => void) => () => void
        onProgress: (cb: (percent: number) => void) => () => void
        onDownloaded: (cb: (version: string) => void) => () => void
        installNow: () => Promise<void>
      }
      app: {
        getVersionInfo: () => Promise<{ launcherVersion: string }>
        openExternal: (url: string) => Promise<void>
      }
    }
  }
}

export {}
