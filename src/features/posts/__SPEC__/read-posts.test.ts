import { expect, it, onTestFinished, vi } from 'vitest'
import { readPosts } from '../read-posts'

function compiledFiles(entries: Record<string, Record<string, unknown>>) {
  return Object.fromEntries(
    Object.entries(entries).map(([filename, fields]) => [
      '/content/posts/' + filename,
      {
        ...fields,
        source: 'posts/' + filename,
        sections: [{ html: '<p>正文</p>' }],
      },
    ]),
  )
}

it('用文件名生成文章路径，按日期倒序保留正文', () => {
  const posts = readPosts(
    compiledFiles({
      '第一 篇.md': { title: '第一篇', date: '2026-03-12' },
      'older.md': { title: '旧文章', date: '2025-02-21' },
    }),
  )

  expect(posts.map((post) => post.slug)).toEqual(['第一 篇', 'older'])
  expect(posts[0].sections).toEqual([{ html: '<p>正文</p>' }])
  expect(posts[0].source).toBe('posts/第一 篇.md')
})

it('带时区的日期按实际发布时间排序，归档与详情都使用 UTC 日期', () => {
  const posts = readPosts(
    compiledFiles({
      'earlier.md': { title: '较早', date: '2026-01-01T00:30:00+08:00' },
      'later.md': { title: '较晚', date: '2025-12-31T22:00:00Z' },
    }),
  )

  expect(posts.map((post) => post.slug)).toEqual(['later', 'earlier'])
  expect(posts[1].date.slice(0, 10)).toBe('2025-12-31')
})

it.each([
  [{ date: '2026-03-01' }, 'title'],
  [{ title: '文章', date: '2025-02-29' }, 'date'],
  [{ title: '文章', date: '无日期' }, 'date'],
  [{ title: '文章', date: '2026-03-01', duration: 2 }, 'duration'],
])('校验文章元数据并指出有误的文件和字段 %#', (fields, field) => {
  const files = compiledFiles({ 'example.md': fields })

  expect(() => readPosts(files)).toThrow('example.md.' + field)
})

it('不带时区的 ISO 时间在构建机和读者浏览器中属于同一天', () => {
  const files = compiledFiles({
    'new-year.md': { title: '新年', date: '2026-01-01T00:30:00' },
  })

  onTestFinished(() => {
    vi.unstubAllEnvs()
  })
  vi.stubEnv('TZ', 'Asia/Shanghai')
  expect(readPosts(files)[0].date).toBe('2026-01-01T00:30:00.000Z')

  vi.stubEnv('TZ', 'America/Los_Angeles')
  expect(readPosts(files)[0].date).toBe('2026-01-01T00:30:00.000Z')
})
