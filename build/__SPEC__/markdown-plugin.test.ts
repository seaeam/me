import { resolve } from 'node:path'
import { createServer } from 'vite'
import { expect, it, vi } from 'vitest'

it('Vite 为 Markdown 模块导出正文、元数据和相对来源路径', async () => {
  vi.stubEnv('CI', 'true')
  vi.stubEnv('GITHUB_TOKEN', '')

  const route = '/content/posts/fixture.md?live-issues'
  const id = resolve('content/posts/fixture.md') + '?live-issues'

  const source = [
    '---',
    'title: 表格示例',
    '---',
    '| 名称 |',
    '| --- |',
    '| 网站 |',
    '',
    '[站外](https://example.test)',
  ].join('\n')

  const server = await createServer({
    configFile: resolve('vite.config.ts'),
    logLevel: 'silent',
    server: { middlewareMode: true, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    plugins: [
      {
        name: 'markdown-fixture',
        enforce: 'pre',
        resolveId(value) {
          if (value === route) return id
        },
        load(value) {
          if (value === id) return source
        },
      },
    ],
  })

  try {
    const { default: content } = await server.ssrLoadModule(route)

    expect(content.title).toBe('表格示例')
    expect(content.source).toBe('posts/fixture.md')
    expect(content.sections).toHaveLength(1)

    const [{ html }] = content.sections

    expect(html).toContain('<div class="table-scroll"><table>')
    expect(html).toContain('target="_blank" rel="noopener"')
  } finally {
    await server.close()
    vi.unstubAllEnvs()
  }
})
