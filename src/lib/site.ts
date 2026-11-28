import settings from '@content/site.json'
import { contentRecord, optionalText, requiredText } from './content-fields'

const fields = contentRecord(settings, 'site.json')

export const site = {
  name: requiredText(fields.name, 'site.json.name'),
  blogLabel: requiredText(fields.blogLabel, 'site.json.blogLabel'),
  projectsLabel: requiredText(fields.projectsLabel, 'site.json.projectsLabel'),
  projectsIntro: optionalText(fields.projectsIntro, 'site.json.projectsIntro'),
  github: optionalText(fields.github, 'site.json.github'),
  afdian: optionalText(fields.afdian, 'site.json.afdian'),
}
