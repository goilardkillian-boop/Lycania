/**
 * Fait échouer `promise` avec un message clair si elle n'a pas répondu après `ms` millisecondes,
 * plutôt que de rester bloqué indéfiniment sans retour visuel (utile pour les petites requêtes
 * JSON qui devraient répondre quasi instantanément : manifeste de versions, manifeste Java…).
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer!)
  }
}
