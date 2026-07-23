const XBL_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate'
const XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize'

export interface XblResult {
  token: string
  userHash: string
}

interface XblResponse {
  Token: string
  DisplayClaims: { xui: Array<{ uhs: string }> }
}

interface XstsErrorResponse {
  Identity?: string
  XErr?: number
  Message?: string
}

/** Messages d'erreur documentés par Microsoft pour les codes XErr de XSTS. */
const XSTS_ERROR_MESSAGES: Record<number, string> = {
  2148916233: "Ce compte Microsoft n'a pas de profil Xbox. Crée-en un sur https://www.xbox.com puis réessaie.",
  2148916235: 'Xbox Live n\'est pas disponible dans ton pays/région.',
  2148916236: "Le compte doit valider sa majorité (vérification de l'âge requise sur https://account.microsoft.com).",
  2148916237: "Le compte doit valider sa majorité (vérification de l'âge requise sur https://account.microsoft.com).",
  2148916238: "Ce compte est un compte enfant. Un adulte de la famille doit ajouter ce compte à une famille Xbox et donner son accord."
}

export async function authenticateXboxLive(microsoftAccessToken: string): Promise<XblResult> {
  const res = await fetch(XBL_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${microsoftAccessToken}`
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    })
  })

  if (!res.ok) {
    throw new Error(`Échec de l'authentification Xbox Live (${res.status})`)
  }

  const json = (await res.json()) as XblResponse
  return { token: json.Token, userHash: json.DisplayClaims.xui[0].uhs }
}

export async function authenticateXsts(xblToken: string): Promise<XblResult> {
  const res = await fetch(XSTS_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [xblToken]
      },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    })
  })

  const json = (await res.json()) as XblResponse & XstsErrorResponse

  if (!res.ok || json.XErr) {
    const message = json.XErr
      ? XSTS_ERROR_MESSAGES[json.XErr] ?? json.Message ?? `Erreur XSTS ${json.XErr}`
      : `Échec de l'authentification XSTS (${res.status})`
    throw new Error(message)
  }

  return { token: json.Token, userHash: json.DisplayClaims.xui[0].uhs }
}
