import { strictEqual } from 'assert'
import { access, rm } from 'fs/promises'
import { after, before, test } from 'node:test'
import { arch, platform } from 'os'
import grab from 'grab-github-release'

const exists = file => access(file).then(() => true, () => false)

const repository = 'prantlf/v-jsonlint'
const name = 'jsonlint'
const version = '0.0.6'
const platformSuffixes = {
  linux: 'linux',
  darwin: 'macos',
  win32: 'windows'
}
const archive = `${name}-${platformSuffixes[platform()]}-${arch()}.zip`

function cleanup() {
  return rm(archive, { force: true })
}

before(cleanup)

after(cleanup)

test('download archive from a fixed version', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab(
    { name, repository, version, platformSuffixes })
  if (!await exists(archive)) throw new Error('archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})
