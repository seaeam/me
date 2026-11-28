export function issueLabel(
  repository: string,
  number: string,
  title: string,
  status: string,
) {
  return `${title} · ${repository}#${number} · ${status}`
}
