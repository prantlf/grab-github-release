import { ok, strictEqual } from 'assert'
import { access, mkdir, readFile, rm } from 'fs/promises'
import { after, before, beforeEach, test, mock } from 'node:test'
import { homedir } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { grab, clearCache } from 'grab-github-release'
import releases from './data/releases.json' assert { type: 'json' }

const exists = file => access(file).then(() => true, () => false)
const __dirname = dirname(fileURLToPath(import.meta.url))
const { arch, platform } = process

const repository = 'prantlf/v-jsonlint'
const name = 'jsonlint'
const executable = join('.', platform !== 'win32' ? name : `${name}.exe`)
const version = '0.0.6'
const platformSuffixes = {
  linux: ['linux'],
  darwin: ['macos'],
  win32: ['windows']
}
const archSuffixes = {
  arm64: ['arm64'],
  x64: ['x64', 'x86_64']
}
const archive = `${name}-${platformSuffixes[platform][0]}-${archSuffixes[arch][0]}.zip`
const content = new Blob(
  [await readFile(join(__dirname, `data/${archive}`))],
  { type: 'application.zip' }
)
const targetDirectory = join(__dirname, 'tmp')
const wholeCacheDirectory = join(homedir(), '.cache/grabghr')
const cacheDirectory = join(wholeCacheDirectory, repository.replaceAll('/', '_'))

async function cleanup() {
  // failed on Windows on GitHub
  if (platform === 'win32') return
  await Promise.all([
    rm(archive, { force: true }),
    rm(executable, { force: true }),
    rm(targetDirectory, { recursive: true, force: true }),
    rm(cacheDirectory, { recursive: true, force: true })
  ])
}

before(() => {
  mock.method(global, 'fetch', url => {
    if (url.endsWith('/releases')) {
      return {
        ok: true,
        json() {
          return releases
        }
      }
    }
    if (url.endsWith('.zip')) {
      return {
        ok: true,
        body: content.stream()
      }
    }
    throw new Error(`unrecognised URL "${url}"`)
  })
})

beforeEach(cleanup)

after(async () => {
  await cleanup()
  mock.reset()
})

test('download archive from the latest fixed version', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab({
    name, repository, version
  })
  ok(await exists(archive), 'archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('copy archive of the latest fixed version from cache', async () => {
  await grab({ name, repository, version })
  const { archive: actualArchive, version: actualVersion } = await grab({
    name, repository, version
  })
  ok(await exists(archive), 'archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from the latest fixed version without cache', async () => {
  await grab({ name, repository, version })
  const { archive: actualArchive, version: actualVersion } = await grab({
    name, repository, version, cache: false
  })
  ok(await exists(archive), 'archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from the latest symbolic version with platforms', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab({
    name, repository, version: 'latest', platformSuffixes
  })
  ok(await exists(archive), 'archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from the latest semantic version with architectures', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab({
    name, repository, version: '>=0.0.1', archSuffixes
  })
  ok(await exists(archive), 'archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from a fixed tag', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab({
    name, repository, version: `v${version}`
  })
  ok(await exists(archive), 'archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

test('download archive from an old fixed version', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab({
    name, repository, version: '0.0.5'
  })
  ok(await exists(archive), 'archive not found')
  strictEqual(actualVersion, '0.0.5')
  strictEqual(actualArchive, archive)
})

test('download archive from the latest fixed version with a guessed name', async () => {
  const { archive: actualArchive, version: actualVersion } = await grab({
    repository, version
  })
  ok(await exists(archive), 'archive not found')
  strictEqual(actualVersion, version)
  strictEqual(actualArchive, archive)
})

if (platform !== 'win32') {
  test('download archive from the latest implicit version and unpack executable', async () => {
    const { executable: actualExecutable, version: actualVersion } = await grab({
      name, repository, unpackExecutable: true, verbose: true
    })
    ok(!await exists(archive), 'archive found')
    ok(await exists(executable), 'executable not found')
    strictEqual(actualVersion, version)
    strictEqual(actualExecutable, executable)
  })
}

test('download archive from the latest implicit version and unpack executable to a custom directory', async () => {
  await mkdir(targetDirectory, { recursive: true })
  const { executable: actualExecutable, version: actualVersion } = await grab({
    name, repository, targetDirectory, unpackExecutable: true
  })
  ok(await exists(actualExecutable), 'executable not found')
  strictEqual(actualVersion, version)
  ok(actualExecutable.endsWith(executable))
})

if (platform !== 'win32') {
  test('copy archive of the latest implicit version from cache and unpack executable to a custom directory', async () => {
    await mkdir(targetDirectory, { recursive: true })
    await grab({ name, repository, targetDirectory, unpackExecutable: true })
    const { executable: actualExecutable, version: actualVersion } = await grab({
      name, repository, targetDirectory, unpackExecutable: true
    })
    ok(await exists(actualExecutable), 'executable not found')
    strictEqual(actualVersion, version)
    ok(actualExecutable.endsWith(executable))
  })

  test('copy archive of the latest implicit version forced only from cache', async () => {
    await grab({ repository, forceCache: true })
    const { archive: actualArchive, version: actualVersion } = await grab({
      repository, forceCache: true
    })
    ok(await exists(archive), 'archive not found')
    strictEqual(actualVersion, version)
    strictEqual(actualArchive, archive)
  })

  test('clear cache for a name', async () => {
    await grab({ repository, version })
    ok(await exists(cacheDirectory), 'cache not found')
    await clearCache({ repository, verbose: true })
    ok(!await exists(cacheDirectory), 'cache found')
    ok(await exists(wholeCacheDirectory), 'whole cache not found')
  })

  test('clear the whole cache', async () => {
    await grab({ repository, version })
    ok(await exists(cacheDirectory), 'cache not found')
    await clearCache()
    ok(!await exists(wholeCacheDirectory), 'whole cache found')
  })
}