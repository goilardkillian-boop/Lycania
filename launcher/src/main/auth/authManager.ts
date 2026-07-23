import { EventEmitter } from 'node:events'
import type { AuthState, GameProfile, SignInProgress } from '@shared/types'
import { signInWithMicrosoft, refreshMicrosoftTokens, type MsTokens } from './msAuth'
import { authenticateXboxLive, authenticateXsts } from './xboxAuth'
import { loginWithXbox, fetchMinecraftProfile, hasMinecraftEntitlement, type MinecraftSession } from './minecraftAuth'
import { saveSession, loadSession, clearSession } from './tokenStore'

const REFRESH_MARGIN_MS = 5 * 60 * 1000

interface ActiveSession {
  msTokens: MsTokens
  mcSession: MinecraftSession
  profile: GameProfile
}

/**
 * Orchestre la chaîne complète Microsoft -> Xbox Live -> XSTS -> Minecraft Services,
 * garde la session courante en mémoire et gère le rafraîchissement automatique des tokens.
 */
export class AuthManager extends EventEmitter {
  private session: ActiveSession | undefined
  private signInAbortController: AbortController | undefined

  getState(): AuthState {
    if (this.session) return { status: 'signed-in', profile: this.session.profile }
    return { status: 'signed-out' }
  }

  private emitProgress(stage: SignInProgress['stage'], message: string): void {
    this.emit('progress', { stage, message } satisfies SignInProgress)
  }

  private emitState(): void {
    this.emit('state', this.getState())
  }

  async restorePersistedSession(): Promise<AuthState> {
    const stored = await loadSession()
    if (!stored) return this.getState()

    try {
      const msTokens = await refreshMicrosoftTokens(stored.microsoftRefreshToken)
      const { mcSession, profile } = await this.completeXboxChain(msTokens)
      this.session = { msTokens, mcSession, profile }
      await this.persist()
      this.emitState()
    } catch {
      // Refresh token expired/revoked: require an interactive sign-in again.
      await clearSession()
    }

    return this.getState()
  }

  async signIn(): Promise<AuthState> {
    this.signInAbortController?.abort()
    const controller = new AbortController()
    this.signInAbortController = controller

    try {
      this.emitProgress('opening-browser', 'Ouverture du navigateur pour la connexion Microsoft…')
      const msTokens = await (async () => {
        this.emitProgress('waiting-for-microsoft', 'En attente de la connexion Microsoft…')
        return signInWithMicrosoft(controller.signal)
      })()

      const { mcSession, profile } = await this.completeXboxChain(msTokens)
      this.session = { msTokens, mcSession, profile }
      await this.persist()
      this.emitProgress('done', 'Connecté !')
      this.emitState()
      return this.getState()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.emit('state', { status: 'error', error: message } satisfies AuthState)
      throw err
    } finally {
      if (this.signInAbortController === controller) this.signInAbortController = undefined
    }
  }

  cancelSignIn(): void {
    this.signInAbortController?.abort()
  }

  async signOut(): Promise<void> {
    this.session = undefined
    await clearSession()
    this.emitState()
  }

  private async completeXboxChain(
    msTokens: MsTokens
  ): Promise<{ mcSession: MinecraftSession; profile: GameProfile }> {
    this.emitProgress('xbox-live', 'Connexion à Xbox Live…')
    const xbl = await authenticateXboxLive(msTokens.accessToken)

    this.emitProgress('xsts', 'Vérification XSTS…')
    const xsts = await authenticateXsts(xbl.token)

    this.emitProgress('minecraft-services', 'Connexion aux services Minecraft…')
    const mcSession = await loginWithXbox(xsts.userHash, xsts.token)

    this.emitProgress('checking-ownership', 'Vérification de la possession du jeu…')
    await hasMinecraftEntitlement(mcSession.minecraftAccessToken)

    this.emitProgress('fetching-profile', 'Récupération du profil Minecraft…')
    const mcProfile = await fetchMinecraftProfile(mcSession.minecraftAccessToken)

    const profile: GameProfile = {
      minecraftUuid: mcProfile.uuid,
      minecraftUsername: mcProfile.username,
      skinUrl: mcProfile.skinUrl
    }

    return { mcSession, profile }
  }

  /**
   * Retourne un access token Minecraft valide, en rafraîchissant la chaîne
   * Microsoft -> Xbox -> XSTS -> Minecraft si besoin. À appeler juste avant de lancer le jeu.
   */
  async getValidMinecraftAccessToken(): Promise<{ accessToken: string; profile: GameProfile }> {
    if (!this.session) {
      throw new Error('Aucune session active, connecte-toi avec ton compte Microsoft.')
    }

    const expiringSoon = this.session.mcSession.expiresAt - Date.now() < REFRESH_MARGIN_MS
    if (!expiringSoon) {
      return { accessToken: this.session.mcSession.minecraftAccessToken, profile: this.session.profile }
    }

    const msExpiringSoon = this.session.msTokens.expiresAt - Date.now() < REFRESH_MARGIN_MS
    const msTokens = msExpiringSoon
      ? await refreshMicrosoftTokens(this.session.msTokens.refreshToken)
      : this.session.msTokens

    const { mcSession, profile } = await this.completeXboxChain(msTokens)
    this.session = { msTokens, mcSession, profile }
    await this.persist()
    this.emitState()

    return { accessToken: mcSession.minecraftAccessToken, profile }
  }

  private async persist(): Promise<void> {
    if (!this.session) return
    await saveSession({
      microsoftRefreshToken: this.session.msTokens.refreshToken,
      minecraftUuid: this.session.profile.minecraftUuid,
      minecraftUsername: this.session.profile.minecraftUsername,
      skinUrl: this.session.profile.skinUrl
    })
  }
}
