import type { Plugin, ViteDevServer } from 'vite'
import { githubIssuesResponse } from '../server/github-issues'

export function githubIssuesApi(githubToken?: string): Plugin {
  function serveIssues({ middlewares }: Pick<ViteDevServer, 'middlewares'>) {
    middlewares.use('/api/github-issues', async (req, res, next) => {
      try {
        if (req.method !== 'GET') {
          res.writeHead(405, { Allow: 'GET' }).end()

          return
        }

        const { searchParams } = new URL(req.url ?? '/', 'http://localhost')
        const response = await githubIssuesResponse(searchParams, githubToken)

        res.writeHead(response.status, Object.fromEntries(response.headers))
        res.end(await response.text())
      } catch (error) {
        next(error)
      }
    })
  }

  return {
    name: 'github-issues-api',
    configureServer: serveIssues,
    configurePreviewServer: serveIssues,
  }
}
