import { createHash } from 'node:crypto'

type Snapshot<T> = { value: T; expiresAt: number }

type CacheEntry<T> = { request: Promise<Snapshot<T>>; expiresAt: number }

export type SnapshotCache<T> = Map<string, CacheEntry<T>>

export function cachedSnapshot<T>(
  cache: SnapshotCache<T>,
  resource: string,
  token: string | undefined,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<Snapshot<T>> {
  const account = token
    ? createHash('sha256').update(token).digest('hex')
    : 'anonymous'

  const key = `${account}:${resource}`
  const cached = cache.get(key)

  if (cached && cached.expiresAt > Date.now()) return cached.request

  const entry: CacheEntry<T> = {
    expiresAt: Infinity,
    request: load().then((value) => {
      entry.expiresAt = Date.now() + ttlSeconds * 1000

      return { value, expiresAt: entry.expiresAt }
    }),
  }

  cache.set(key, entry)
  void entry.request.catch(() => cache.delete(key))

  return entry.request
}
