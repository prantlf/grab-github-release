import debug from 'debug'
import { createWriteStream, promises } from 'fs'
import { join } from 'path'
import { clean, satisfies, valid } from 'semver'
import { Readable } from 'stream'
import { open as openArchive } from 'yauzl'

let log = debug('grabghr')
const { chmod, unlink } = promises
const { arch, platform } = process

/* c8 ignore next 5 */
function delay() {
  const delay = Math.floor((5 + 5 * Math.random()) * 1000)
  log('wait %d ms before trying again', delay)
  return new Promise(resolve => setTimeout(resolve, delay))
}

async function retry(action) {
  for (let attempt = 0;;) {
    try {
      return await action()
      /* c8 ignore next 7 */
    } catch (err) {
      if (++attempt === 3) throw err
      log('attempt failed: %s', err.message)
    }
    await delay()
  }
}

function fetchSafely(url) {
  return retry(async () => {
    log('fetch "%s"', url)
    const res = await fetch(url)
    /* c8 ignore next 5 */
    if (!res.ok) {
      const err = new Error(`GET "${url}" failed: ${res.status} ${res.statusText}`)
      err.response = res
      throw err
    }
    return res
  })
}

const defaultPlatformSuffixes = {
  darwin: ['macos'],
  linux: [],
  win32: ['windows']
}

const defaultArchSuffixes = {
  arm64: ['aarch64'],
  x64: ['amd64', 'x86_64', 'x86']
}

function getArchiveSuffixes(platformSuffixes, archSuffixes) {
  /* c8 ignore next 3 */
  const plats = platformSuffixes && platformSuffixes[platform] || defaultPlatformSuffixes[platform] || []
  if (!plats.includes(platform)) plats.push(platform)
  const archs = archSuffixes && archSuffixes[arch] || defaultArchSuffixes[arch] || []
  if (!archs.includes(arch)) archs.push(arch)
  return plats.map(plat => archs.map(arch => `-${plat}-${arch}.zip`)).flat()
}

async function getRelease(name, repo, verspec, platformSuffixes, archSuffixes) {
  const suffixes = getArchiveSuffixes(platformSuffixes, archSuffixes)
  const archives = name && suffixes.map(suffix => `${name}${suffix}`)
  const url = `https://api.github.com/repos/${repo}/releases`
  const res = await fetchSafely(url)
  const releases = await res.json()
  log('%d releases', releases.length)
  for (const { tag_name, assets } of releases) {
    /* c8 ignore next */
    const version = clean(tag_name) || tag_name
    if (valid(version) && (verspec === 'latest' || satisfies(version, verspec))) {
      log('match "%s" (%s)', version, tag_name)
      for (const { name: file, browser_download_url: url } of assets) {
        if (archives) {
          if (archives.includes(file)) {
            log('match "%s"', file)
            return { name, version, archive: file, url }
          }
        } else {
          const suffix = suffixes.find(suffix => file.endsWith(suffix))
          if (suffix) {
            log('match by suffix "%s"', file)
            const name = file.substring(0, file.length - suffix.length)
            return { name, version, archive: file, url }
          }
        }
        log('skip "%s"', file)
      }
      /* c8 ignore next 7 */
      throw new Error(`no suitable archive found for ${version}`)
    } else {
      log('skip "%s" (%s)', version, tag_name)
    }
  }
  throw new Error(`version matching "${verspec}" not found`)
}

async function download(url, archive) {
  log('download "%s"', url)
  const res = await fetchSafely(url)
  await new Promise((resolve, reject) => {
    const stream = Readable.fromWeb(res.body)
    stream
      .on('error', reject)
      .pipe(createWriteStream(archive))
      .on('finish', () => resolve())
      .on('error', reject)
  })
}

function unpack(archive, targetDirectory) {
  log('unpack "%s"', archive)
  return new Promise((resolve, reject) =>
    openArchive(archive, { lazyEntries: true }, (err, zip) => {
      /* c8 ignore next */
      if (err) return reject(err)
      zip
        .on('entry', entry => {
          const { fileName } = entry
          /* c8 ignore next */
          if (fileName.endsWith('/')) return new Error('directory in archive')
          const filePath = targetDirectory ? join(targetDirectory, fileName) : fileName
          log('write "%s"', filePath)
          zip.openReadStream(entry, (err, stream) => {
            /* c8 ignore next */
            if (err) return reject(err)
            stream
              .on('error', reject)
              .pipe(createWriteStream(filePath))
              .on('finish', () => resolve(filePath))
              .on('error', reject)
          })
        })
        .on('end', () => reject(new Error('empty archive')))
        .on('error', reject)
      zip.readEntry()
    })
  )
}

async function makeExecutable(executable) {
  if (platform != 'win32') {
    log('make "%s" executable', executable)
    await chmod(executable, 0o755)
  }
}

export default async function grab({ name, repository, version, platformSuffixes, archSuffixes, targetDirectory, unpackExecutable, verbose }) {
  if (verbose) log = console.log.bind(console)
  if (!version) version = 'latest'
  const verspec = clean(version) || version
  let archive, url;
  ({ name, version, archive, url } = await getRelease(name, repository, verspec, platformSuffixes, archSuffixes))
  if (targetDirectory) archive = join(targetDirectory, archive)
  await download(url, archive)
  if (unpackExecutable) {
    const executable = await unpack(archive, targetDirectory)
    await makeExecutable(executable)
    log('remove "%s"', archive)
    await unlink(archive)
    return { executable, version }
  }
  return { archive, version }
}
