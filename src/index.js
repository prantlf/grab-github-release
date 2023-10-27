import debug from 'debug'
import { createWriteStream, promises } from 'fs'
import { platform, arch } from 'os'
import { join } from 'path'
import { clean, satisfies, valid } from 'semver'
import { Readable } from 'stream'
import { open as openArchive } from 'yauzl'

let log = debug('grabghr')
const { chmod, unlink } = promises

function delay() {
  const delay = (5 + 5 * Math.random()) * 1000
  log('wait %d ms before trying again', delay)
  return new Promise(resolve => setTimeout(resolve, delay))
}

async function retry(action) {
  for (let attempt = 0;;) {
    try {
      return await action()
      /* c8 ignore next 5 */
    } catch (err) {
      if (++attempt === 3) throw err
      log('attempt failed: %s', err.message)
    }
    await delay()
  }
}

function fetchSafely(url) {
  return retry(() => {
    log('fetch "%s"', url)
    return fetch(url)
  })
}

function getArchiveSuffix(platformSuffixes) {
  let plat = platform()
  /* c8 ignore next */
  if (platformSuffixes) plat = platformSuffixes[plat] || plat
  return `-${plat}-${arch()}.zip`
}

async function getRelease(name, repo, verspec, platformSuffixes) {
  const suffix = getArchiveSuffix(platformSuffixes)
  const archive = name && `${name}${suffix}`
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
        if (archive) {
          if (file === archive) {
            log('match "%s"', file)
            return { name, version, archive, url }
          }
        } else if (file.endsWith(suffix)) {
          log('match by suffix "%s"', file)
          const name = file.substring(0, file.length - suffix.length)
          return { name, version, archive: file, url }
        }
        log('skip "%s"', file)
      }
      /* c8 ignore next 7 */
      throw new Error(`archive ${archive ? '"' + archive + '"' : 'ending with ' + suffix} not found in ${version}`)
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
  if (platform() != 'win32') {
    log('make "%s" executable', executable)
    await chmod(executable, 0o755)
  }
}

export default async function grab({ name, repository, version, platformSuffixes, targetDirectory, unpackExecutable, verbose }) {
  if (verbose) log = console.log.bind(console)
  if (!version) version = 'latest'
  const verspec = clean(version) || version
  let archive, url
  if (name && valid(verspec)) {
    version = verspec
    archive = `${name}${getArchiveSuffix(platformSuffixes)}`
    url = `https://github.com/${repository}/releases/download/v${version}/${archive}`
  } else {
    ({ name, version, archive, url } = await getRelease(name, repository, verspec, platformSuffixes))
  }
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
