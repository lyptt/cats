import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authToken = process.env.GITHUB_ACCESS_TOKEN || ''
const gistId = process.env.GIST_ID || ''

;(async () => {
  const result = fetch(
    'https://fosstodon.org/api/v1/timelines/tag/catsofmastodon?limit=20'
  )
  /** @type Array<any> */
  const data = await (await result).json()
  const post = data.find((obj) => (obj.media_attachments?.length ?? 0) > 0)
  const attachment = post.media_attachments[0]

  const contentUrl = post.url
  const photoUrl =
    attachment.url || attachment.preview_url || attachment.remote_url

  const widgetData = {
    content_url: contentUrl,
    photo_url: photoUrl,
  }

  const widget = JSON.parse(
    await fs.readFile(path.join(__dirname, 'template.json'), 'utf8')
  )
  widget.data = widgetData

  if (!authToken || !gistId) {
    return await fs.writeFile(
      path.join(__dirname, 'widget.json'),
      JSON.stringify(widget, null, 2),
      'utf8'
    )
  }

  await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      description: new Date(),
      files: {
        'home.json': {
          content: JSON.stringify(widget, null, 2),
        },
      },
    }),
  })
})()
