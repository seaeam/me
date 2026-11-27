import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import MarkdownIt from 'markdown-it'
import frontMatter from 'front-matter'
import { linkAttributes } from './src/lib/content-links'
import { renderMarkdown } from './src/lib/markdown-issues'
import { homeIssueResponse } from './server/github-issues'

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})
markdown.renderer.rules.table_open = () => '<div class="table-scroll"><table>\n'
markdown.renderer.rules.table_close = () => '</table></div>\n'
markdown.renderer.rules.link_open = (
  tokens,
  index,
  options,
  _env,
  renderer,
) => {
  const link = tokens[index]
  const { target, rel } = linkAttributes(link.attrGet('href') || '')
  if (target && rel) {
    link.attrSet('target', target)
    link.attrSet('rel', rel)
  }
  return renderer.renderToken(tokens, index, options)
}

function githubCredential(mode: string) {
  const token = loadEnv(mode, process.cwd(), 'GITHUB_TOKEN').GITHUB_TOKEN
  if (token || process.env.CI || process.env.VERCEL) return token
  try {
    const credential = execFileSync(
      'git',
      ['-c', 'credential.interactive=never', 'credential', 'fill'],
      {
        input: 'protocol=https\nhost=github.com\n\n',
        encoding: 'utf8',
        timeout: 3000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        stdio: ['pipe', 'pipe', 'ignore'],
      },
    )
    return credential.match(/^password=(.+)$/m)?.[1]
  } catch {
    return undefined
  }
}

function siteContent(mode: string): Plugin {
  const githubToken = githubCredential(mode)
  function serveIssues({ middlewares }: Pick<ViteDevServer, 'middlewares'>) {
    middlewares.use('/api/github-issues', async (req, res, next) => {
      try {
        if (req.method !== 'GET') {
          res.writeHead(405, { Allow: 'GET' }).end()
          return
        }
        const response = await homeIssueResponse(githubToken)
        res.writeHead(response.status, Object.fromEntries(response.headers))
        res.end(await response.text())
      } catch (error) {
        next(error)
      }
    })
  }
  return {
    name: 'site-content',
    configureServer: serveIssues,
    configurePreviewServer: serveIssues,
    async transform(source, id) {
      const liveIssues = id.endsWith('.md?live-issues')
      if (!liveIssues && !id.endsWith('.md')) return
      const { attributes, body } = frontMatter<Record<string, unknown>>(source)
      const html = await renderMarkdown(markdown, body, {
        liveIssues,
        githubToken,
      })
      return {
        code: 'export default ' + JSON.stringify({ ...attributes, html }),
        map: null,
      }
    },
  }
}

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@content': fileURLToPath(new URL('./content', import.meta.url)),
    },
  },
  ssgOptions: { dirStyle: 'nested' },
  plugins: [siteContent(mode), vue(), UnoCSS()],
}))
