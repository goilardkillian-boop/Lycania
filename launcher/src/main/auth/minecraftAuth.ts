const LOGIN_WITH_XBOX_URL = 'https://api.minecraftservices.com/authentication/login_with_xbox'
const PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile'
const ENTITLEMENTS_URL = 'https://api.minecraftservices.com/entitlements/mcstore'

export interface MinecraftSession {
  minecraftAccessToken: string
  /** Timestamp epoch ms at which minecraftAccessToken expires */
  expiresAt: number
}

interface LoginWithXboxResponse {
  access_token: string
  expires_in: number
}

export async function loginWithXbox(userHash: string, xstsToken: string): Promise<MinecraftSession> {
  const res = await fetch(LOGIN_WITH_XBOX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ identityToken: `XBL3.0 x=${userHash};${xstsToken}` })
  })

  if (!res.ok) {
    throw new Error(`Échec de la connexion aux services Minecraft (${res.status})`)
  }

  const json = (await res.json()) as LoginWithXboxResponse
  return { minecraftAccessToken: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
}

interface EntitlementsResponse {
  items: Array<{ name: string; signature: string }>
}

/**
 * Vérifie que le compte possède bien Minecraft: Java Edition.
 * Ne bloque jamais fatalement sur cette étape: certains comptes légitimes (Game Pass,
 * migration récente) peuvent avoir une liste d'entitlements vide ou l'endpoint indisponible;
 * le vrai test de vérité est la capacité à récupérer un profil Minecraft ensuite.
 */
export async function hasMinecraftEntitlement(minecraftAccessToken: string): Promise<boolean> {
  try {
    const res = await fetch(ENTITLEMENTS_URL, {
      headers: { Authorization: `Bearer ${minecraftAccessToken}` }
    })
    if (!res.ok) return true
    const json = (await res.json()) as EntitlementsResponse
    return json.items.length > 0
  } catch {
    return true
  }
}

export class NoMinecraftProfileError extends Error {
  constructor() {
    super(
      "Ce compte Microsoft ne possède pas Minecraft: Java Edition, ou n'a jamais choisi de pseudo. " +
        'Vérifie sur https://www.minecraft.net que le compte a bien acheté le jeu.'
    )
    this.name = 'NoMinecraftProfileError'
  }
}

export interface MinecraftProfileResult {
  uuid: string
  username: string
  skinUrl?: string
}

interface ProfileResponse {
  id: string
  name: string
  skins: Array<{ url: string; state: string }>
}

export async function fetchMinecraftProfile(minecraftAccessToken: string): Promise<MinecraftProfileResult> {
  const res = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${minecraftAccessToken}` }
  })

  if (res.status === 404) {
    throw new NoMinecraftProfileError()
  }
  if (!res.ok) {
    throw new Error(`Échec de la récupération du profil Minecraft (${res.status})`)
  }

  const json = (await res.json()) as ProfileResponse
  const activeSkin = json.skins.find((s) => s.state === 'ACTIVE')
  return { uuid: json.id, username: json.name, skinUrl: activeSkin?.url }
}
