import projectData from '@content/projects.json'
import { contentRecord, optionalText, requiredText } from '@/lib/content-fields'
import type { ProjectGroup } from './types'

function groupAnchor(name: string, usedIds: Set<string>) {
  const slug =
    name
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.join('-') || 'group'

  const base = name === 'Current Focus' ? 'current-focus' : 'projects-' + slug
  let id = base

  for (let suffix = 2; usedIds.has(id); suffix++) {
    id = base + '-' + suffix
  }

  usedIds.add(id)

  return id
}

function readProjectGroups(content: unknown) {
  if (!Array.isArray(content)) throw new Error('projects.json 应为项目列表')

  const groups = new Map<string, ProjectGroup>()
  const usedIds = new Set<string>()

  for (const [index, entry] of content.entries()) {
    const path = 'projects.json[' + index + ']'
    const fields = contentRecord(entry, path)

    const groupName =
      optionalText(fields.group, path + '.group') || 'Current Focus'

    let group = groups.get(groupName)

    if (!group) {
      group = {
        id: groupAnchor(groupName, usedIds),
        name: groupName,
        projects: [],
      }
      groups.set(groupName, group)
    }

    group.projects.push({
      name: requiredText(fields.name, path + '.name'),
      description: optionalText(fields.description, path + '.description'),
      icon: optionalText(fields.icon, path + '.icon'),
      iconDark: optionalText(fields.iconDark, path + '.iconDark'),
      url: optionalText(fields.url, path + '.url'),
    })
  }

  return [...groups.values()]
}

export const projectGroups = readProjectGroups(projectData)
