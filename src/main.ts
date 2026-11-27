import 'virtual:uno.css'
import './styles/base.css'
import './styles/prose.css'
import './styles/github-issue.css'
import NProgress from 'nprogress'
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router/routes'

export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior(to, _from, saved) {
      if (saved) return saved
      const target = to.hash && document.getElementById(to.hash.slice(1))
      return target ? { el: target } : { top: 0 }
    },
  },
  ({ router, isClient }) => {
    if (!isClient) return
    NProgress.configure({ showSpinner: false })
    router.beforeEach((_to, from) => {
      if (from.matched.length) NProgress.start()
    })
    router.afterEach(() => NProgress.done())
  },
)
