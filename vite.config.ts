import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { githubIssuesApi } from './build/github-issues-api'
import { postHtmlFileName } from './build/post-html-file-name'
import { markdownContentPlugin } from './build/render-markdown'

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

export default defineConfig(({ mode }) => {
  const githubToken = githubCredential(mode)

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@content': fileURLToPath(new URL('./content', import.meta.url)),
      },
    },
    ssgOptions: { dirStyle: 'nested', htmlFileName: postHtmlFileName },
    plugins: [
      markdownContentPlugin(githubToken),
      githubIssuesApi(githubToken),
      vue(),
      UnoCSS(),
    ],
  }
})
