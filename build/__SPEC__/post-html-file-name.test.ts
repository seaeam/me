import { expect, it } from 'vitest'
import { postHtmlFileName } from '../post-html-file-name'
import { postPath } from '../../src/router/sections'

it.each(['一 篇', '进度100%', '保留%20字面值', '100%25'])(
  '将文章 %s 的公开路径还原为静态目录名',
  (slug) => {
    const filename = postPath(slug).slice(1) + '/index.html'

    expect(postHtmlFileName(filename)).toBe('posts/' + slug + '/index.html')
  },
)

it.each(['index.html', 'posts/index.html', 'projects/a%20b/index.html'])(
  '保留其他页面的输出位置 %s',
  (filename) => {
    expect(postHtmlFileName(filename)).toBe(filename)
  },
)
