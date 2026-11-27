declare module '*.md' {
  const page: import('./lib/markdown-content').MarkdownContent
  export default page
}

declare module '*.md?live-issues' {
  export { default } from '*.md'
}
