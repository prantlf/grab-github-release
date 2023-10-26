import { strictEqual } from 'assert'
import { access, readFile, rm } from 'fs/promises'
import { after, before, beforeEach, test, mock } from 'node:test'
import { arch, platform } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import grab from 'grab-github-release'
import releases from './data/releases.json' assert { type: 'json' }

const exists = file => access(file).then(() => true, () => false)

const __dirname = dirname(fileURLToPath(import.meta.url))

const repository = 'prantlf/v-jsonlint'
const name = 'jsonlint'
const executable = platform() != 'win32' ? name : `${name}.exe`
const version = '0.0.6'
const platformSuffixes = {
  linux: 'linux',
  darwin: 'macos',
  win32: 'windows'
}
const archive = `${name}-${platformSuffixes[platform()]}-${arch()}.zip`
const content = new Blob(
  [await readFile(join(__dirname, `data/${archive}`))],
  { type: 'applicaiton.zip' }
)

function cleanup() {
  return Promise.all([
    rm(archive, { force: true }),
    rm(executable, { force: true })
  ])
}

before(() => {
  mock.method(global, 'fetch', url => {
    if (url.endsWith('/releases')) {
      return {
        json() {
          return releases
        }
      }
    }
    if (url.endsWith('.zip')) {
      return {
        body: content.stream()
      }
    }
    throw new Error(`unrecognised URL "${url}"`)
  })
})

beforeEach(cleanup)

after(async () => {
  // failed on Windows on GitHub
  if (platform() != 'win32') await cleanup()
  mock.reset()
})

test('download archive from the latest fixed version', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab(
    { name, repository, version, platformSuffixes })
  if (!await exists(archive)) throw new Error('archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from the latest symbolic version', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab(
    { name, repository, version: 'latest', platformSuffixes })
  if (!await exists(archive)) throw new Error('archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from the latest semantic version', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab(
    { name, repository, version: '>=0.0.1', platformSuffixes })
  if (!await exists(archive)) throw new Error('archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from a fixed tag', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab(
    { name, repository, version: `v${version}`, platformSuffixes })
  if (!await exists(archive)) throw new Error('archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from an old fixed version', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab(
    { name, repository, version: '0.0.5', platformSuffixes })
  if (!await exists(archive)) throw new Error('archive not found')
  strictEqual(actualVersion, '0.0.5')
  strictEqual(actualArchive, archive)
})

test('download archive from the latest fixed version with a guessed name', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab(
    { repository, version, platformSuffixes })
  if (!await exists(archive)) throw new Error('archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from the latest implicit version and unpack executable', async () => {
  const { executable: actualExecutable, version: actualVersion } = await grab(
    { name, repository, platformSuffixes, unpackExecutable: true, verbose: true })
  if (await exists(archive)) throw new Error('archive found')
  if (!await exists(executable)) throw new Error('executable not found')
  strictEqual(actualVersion, version)
  strictEqual(actualExecutable, executable)
  strictEqual(actualExecutable, executable)
})
