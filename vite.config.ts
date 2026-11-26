import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import MarkdownIt from 'markdown-it'
import frontMatter from 'front-matter'
import { linkAttributes } from './src/lib/content-links'

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true })
markdown.renderer.rules.table_open = () => '<div class="table-scroll"><table>\n'
markdown.renderer.rules.table_close = () => '</table></div>\n'
markdown.renderer.rules.link_open = (tokens, index, options, _env, renderer) => {
  const link = tokens[index]
  const { target, rel } = linkAttributes(link.attrGet('href') || '')
  if (target && rel) {
    link.attrSet('target', target)
    link.attrSet('rel', rel)
  }
  return renderer.renderToken(tokens, index, options)
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@content': fileURLToPath(new URL('./content', import.meta.url)),
    },
  },
  ssgOptions: { dirStyle: 'nested' },
  plugins: [
    {
      name: 'site-content',
      transform(source, id) {
        if (!id.endsWith('.md')) return
        const { attributes, body } = frontMatter(source)
        return { code: 'export default ' + JSON.stringify({ ...attributes, html: markdown.render(body) }), map: null }
      },
    },
    vue(),
    UnoCSS(),
  ],
})
