import { expect, it } from 'vitest'
import { linkAttributes } from '../content-links'

it.each(['/posts', '#main', 'mailto:reader@example.org', 'http://['])(
  '保留站内、邮件或无法解析的地址 %s 的默认打开方式',
  (href) => {
    expect(linkAttributes(href)).toEqual({})
  },
)
