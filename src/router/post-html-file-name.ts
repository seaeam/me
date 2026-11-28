export function postHtmlFileName(filename: string) {
  const slug = filename.match(/^posts\/([^/]+)\/index\.html$/)?.[1]

  if (!slug) return filename

  return 'posts/' + decodeURIComponent(slug) + '/index.html'
}
