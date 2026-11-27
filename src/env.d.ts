declare module '*.md' {
  const page: { html: string }
  export default page
}

declare module '*.md?live-issues' {
  export { default } from '*.md'
}
