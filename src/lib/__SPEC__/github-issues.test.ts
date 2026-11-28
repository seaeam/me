import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchGitHubIssuePage,
  normalizeRepository,
  parseIssueLink,
} from '../github-issues'

const repository = 'example/project'
const issueUrl = 'https://github.com/example/project/issues/7'
const openIssue = { number: 7, title: '修复分页', status: 'Open' }
const gitHubRow = { number: 7, title: '修复分页', state: 'open' }

afterEach(() => vi.unstubAllGlobals())

describe('GitHub 仓库和 issue 链接', () => {
  it('统一仓库名，保留 issue 编号，只识别独立的 issue 链接', () => {
    expect(normalizeRepository(' Example/Project ')).toBe(repository)
    expect(normalizeRepository('example/..')).toBeUndefined()
    expect(parseIssueLink(issueUrl)).toEqual({ repository, number: '7' })
    expect(parseIssueLink(issueUrl + '/comments')).toBeUndefined()
  })
})

describe('GitHub 列表接口', () => {
  it('保留打开的 issue 和项目状态，跳过 PR 与已关闭条目，读取下一页', async () => {
    const response = Response.json(
      [
        { ...gitHubRow, status: { name: 'In progress' } },
        { ...gitHubRow, number: 8 },
        { ...gitHubRow, number: 9, pull_request: {} },
        { ...gitHubRow, number: 10, state: 'closed' },
      ],
      {
        headers: {
          Link: '<https://api.github.com/repos/example/project/issues?page=3>; rel="next"',
        },
      },
    )

    const request = vi.fn<typeof fetch>().mockResolvedValue(response)

    vi.stubGlobal('fetch', request)

    await expect(fetchGitHubIssuePage(repository, 2)).resolves.toEqual({
      issues: [
        { ...openIssue, status: 'In progress' },
        { ...openIssue, number: 8 },
      ],
      nextPage: 3,
    })

    const [url] = request.mock.calls[0]

    expect(new URL(String(url)).searchParams.get('page')).toBe('2')
  })

  it.each([
    ['缺少 state', { number: 7, title: '修复分页' }],
    ['未知 state', { ...gitHubRow, state: 'unknown' }],
    ['PR 字段类型错误', { ...gitHubRow, pull_request: 'yes' }],
    ['项目状态缺少有效名称', { ...gitHubRow, status: { name: 42 } }],
    ['编号为零', { ...gitHubRow, number: 0 }],
    ['标题为空', { ...gitHubRow, title: ' ' }],
  ])('拒绝%s的条目', async (_label, row) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([row])))

    await expect(fetchGitHubIssuePage(repository, 1)).rejects.toThrow()
  })
})
