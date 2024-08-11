import { strictEqual } from 'node:assert'
import { access, rm } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { grab } from 'grab-github-release'

const exists = file => access(file).then(() => true, () => false)
const { platform, arch } = process

const repository = 'prantlf/v-jsonlint'
const name = 'jsonlint'
const version = '0.0.6'
const platformSuffixes = {
  linux: 'linux',
  darwin: 'macos',
  win32: 'windows'
}
const archive = `${name}-${platformSuffixes[platform]}-${arch}.zip`
const cacheDir = join(homedir(), '.cache/grabghr', repository.replaceAll('/', '_'))

function cleanup() {
  return Promise.all([
    rm(archive, { force: true }),
    rm(cacheDir, { recursive: true, force: true })
  ])
}

before(cleanup)

after(cleanup)

test('download archive from a fixed version', async () => {
  if (process.env.CI && platform !== 'darwin') { // fails with 403, only on mac
    const token = process.env.GITHUB_TOKEN || undefined
    const { archive: actualArchive, version: actualVersion } =
      await grab({ name, repository, version, token })
    if (!await exists(archive)) throw new Error('archive not found')
    strictEqual(actualVersion, version)
    strictEqual(actualArchive, archive)
  }
})
