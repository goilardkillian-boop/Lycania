import type { ChildProcess } from 'node:child_process'
import type { ResolvedVersion } from '@xmcl/core'
import type { PackManifest } from '@shared/types'
import { AuthManager } from './auth/authManager'

/**
 * État en mémoire du processus principal, partagé entre les handlers IPC.
 * Un seul launcher, une seule fenêtre, une seule partie en cours: pas besoin de plus qu'un singleton.
 */
export const authManager = new AuthManager()

export const gameState: {
  packManifest: PackManifest | undefined
  resolvedVersion: ResolvedVersion | undefined
  runningProcess: ChildProcess | undefined
} = {
  packManifest: undefined,
  resolvedVersion: undefined,
  runningProcess: undefined
}
