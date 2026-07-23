import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { shell } from 'electron'
import { config } from '../config'
import { createPkcePair, createState } from './pkce'

const AUTHORIZE_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize'
const TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token'
const SCOPE = 'XboxLive.signin offline_access'
const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000

export interface MsTokens {
  accessToken: string
  refreshToken: string
  /** Timestamp epoch ms at which accessToken expires */
  expiresAt: number
}

function page(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Lycania</title>
  <style>body{background:#0b0507;color:#f3e9ea;font-family:system-ui,sans-serif;display:flex;
  align-items:center;justify-content:center;height:100vh;margin:0}
  div{text-align:center}h1{color:#c4283c}</style></head>
  <body><div><h1>${title}</h1><p>${body}</p></div></body></html>`
}

/**
 * Ouvre le navigateur système sur l'écran de connexion Microsoft et attend la redirection
 * loopback (http://127.0.0.1:<port>/callback) portant le code d'autorisation.
 * C'est le flow recommandé par Microsoft pour les applications natives (Authorization Code + PKCE,
 * sans client secret ni WebView embarquée).
 */
function receiveAuthorizationCode(
  state: string,
  challenge: string,
  signal?: AbortSignal
): Promise<{ code: string; redirectUri: string }> {
  return new Promise((resolve, reject) => {
    let redirectUri = ''
    let timeout: NodeJS.Timeout
    let onAbort: (() => void) | undefined

    const server = createServer((req, res) => {
      if (!req.url) return
      const url = new URL(req.url, 'http://127.0.0.1')
      if (url.pathname !== '/callback') {
        res.writeHead(404).end()
        return
      }

      const returnedState = url.searchParams.get('state')
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error_description') || url.searchParams.get('error')

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page('Échec de la connexion', error))
        cleanup()
        reject(new Error(error))
        return
      }

      if (returnedState !== state || !code) {
        res
          .writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          .end(page('Échec de la connexion', 'Réponse invalide.'))
        cleanup()
        reject(new Error('Invalid OAuth state or missing code'))
        return
      }

      res
        .writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        .end(page('Connexion réussie', 'Tu peux fermer cette fenêtre et revenir au launcher Lycania.'))
      cleanup()
      resolve({ code, redirectUri })
    })

    function cleanup(): void {
      clearTimeout(timeout)
      if (onAbort && signal) signal.removeEventListener('abort', onAbort)
      server.close()
    }

    server.on('error', (err) => {
      cleanup()
      reject(err)
    })

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      redirectUri = `http://127.0.0.1:${port}/callback`

      const authorizeUrl = new URL(AUTHORIZE_URL)
      authorizeUrl.searchParams.set('client_id', config.azureClientId)
      authorizeUrl.searchParams.set('response_type', 'code')
      authorizeUrl.searchParams.set('redirect_uri', redirectUri)
      authorizeUrl.searchParams.set('response_mode', 'query')
      authorizeUrl.searchParams.set('scope', SCOPE)
      authorizeUrl.searchParams.set('state', state)
      authorizeUrl.searchParams.set('code_challenge', challenge)
      authorizeUrl.searchParams.set('code_challenge_method', 'S256')
      authorizeUrl.searchParams.set('prompt', 'select_account')

      shell.openExternal(authorizeUrl.toString()).catch((err) => {
        cleanup()
        reject(err)
      })
    })

    timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Délai de connexion dépassé, réessaie.'))
    }, CALLBACK_TIMEOUT_MS)

    if (signal) {
      onAbort = () => {
        cleanup()
        reject(new DOMException('Connexion annulée', 'AbortError'))
      }
      signal.addEventListener('abort', onAbort)
    }
  })
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  error?: string
  error_description?: string
}

async function exchangeToken(body: URLSearchParams): Promise<MsTokens> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  const json = (await res.json()) as TokenResponse
  if (!res.ok || json.error) {
    throw new Error(json.error_description || `Échec de l'échange de token Microsoft (${res.status})`)
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000
  }
}

export async function signInWithMicrosoft(signal?: AbortSignal): Promise<MsTokens> {
  const { verifier, challenge } = createPkcePair()
  const state = createState()

  const { code, redirectUri } = await receiveAuthorizationCode(state, challenge, signal)

  return exchangeToken(
    new URLSearchParams({
      client_id: config.azureClientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
      scope: SCOPE
    })
  )
}

export async function refreshMicrosoftTokens(refreshToken: string): Promise<MsTokens> {
  return exchangeToken(
    new URLSearchParams({
      client_id: config.azureClientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: SCOPE
    })
  )
}
