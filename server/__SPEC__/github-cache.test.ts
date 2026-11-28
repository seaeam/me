import { afterEach, expect, it, vi } from 'vitest'
import { cachedSnapshot, type SnapshotCache } from '../github-cache'

afterEach(() => {
  vi.useRealTimers()
})

it('同一份快照合并在途请求，并从加载完成时开始计算有效期', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(1000)

  const cache: SnapshotCache<string> = new Map()

  const load = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => setTimeout(() => resolve('第一次结果'), 7000)),
    )
    .mockResolvedValueOnce('第二次结果')

  const read = () => cachedSnapshot(cache, 'example/site', undefined, 5, load)
  const pending = read()

  vi.advanceTimersByTime(6500)
  expect(read()).toBe(pending)
  await vi.advanceTimersByTimeAsync(500)
  await expect(pending).resolves.toEqual({
    value: '第一次结果',
    expiresAt: 13000,
  })
  vi.setSystemTime(12999)
  await expect(read()).resolves.toEqual({
    value: '第一次结果',
    expiresAt: 13000,
  })
  vi.setSystemTime(13000)
  await expect(read()).resolves.toEqual({
    value: '第二次结果',
    expiresAt: 18000,
  })
  expect(load).toHaveBeenCalledTimes(2)
})

it('按资源和请求凭据分别使用快照', async () => {
  const cache: SnapshotCache<number> = new Map()
  let sequence = 0

  const read = async (resource: string, token?: string) => {
    const snapshot = await cachedSnapshot(
      cache,
      resource,
      token,
      60,
      async () => ++sequence,
    )

    return snapshot.value
  }

  expect(await read('example/one')).toBe(1)
  expect(await read('example/one', 'test-account')).toBe(2)
  expect(await read('example/two', 'test-account')).toBe(3)
  expect(await read('example/one')).toBe(1)
  expect(await read('example/one', 'test-account')).toBe(2)
})

it('加载失败后允许下一次请求重新获取', async () => {
  const cache: SnapshotCache<string> = new Map()

  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error('离线'))
    .mockResolvedValueOnce('已恢复')

  const read = () => cachedSnapshot(cache, 'example/site', undefined, 60, load)

  await expect(read()).rejects.toThrow('离线')
  await expect(read()).resolves.toMatchObject({ value: '已恢复' })
})
