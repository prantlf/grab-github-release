import debug from 'debug'
import { constants, createWriteStream, promises } from 'fs'
import { homedir } from 'os'
import { join, parse } from 'path'
import { clean, satisfies, valid } from 'semver'
import { Readable } from 'stream'
import { open as openArchive } from 'yauzl'

let log = debug('grabghr')
const { access, chmod, copyFile, mkdir, rm, readdir, rename, unlink } = promises
const { arch, env, platform } = process

async function exists(file) {
  try {
    await access(file, constants.R_OK)
    return true
  } catch (err) {
    /* c8 ignore next */
    if (err.code !== 'ENOENT') throw err
    return false
  }
}

/* c8 ignore next 6 */
function delay(seconds) {
  if (!seconds) seconds = Math.floor(5 + 5 * Math.random())
  const delay = seconds * 1000
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

function fetchSafely(url, token, options = {}) {
  return retry(async () => {
    /* c8 ignore next 8 */
    if (!token) token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
    if (token) {
      options.headers = {
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    }
    log('fetch "%s"%s', url, token ? ' (authorized)' : '')
    options = {
      'User-Agent': 'prantlf/grab-github-release',
      'X-GitHub-Api-Version': '2022-11-28',
       ...options
    }
    const res = await fetch(url, options)
    /* c8 ignore next 38 */
    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        const {
          'retry-after': after,
          'x-ratelimit-limit': limit,
          'x-ratelimit-remaining': remaining,
          'x-ratelimit-used': used,
          'x-ratelimit-reset': reset,
          'x-ratelimit-resource': resource
        } = res.headers
        log('Retry first after: %s', after)
        log('The maximum number of requests that you can make per hour: %s', limit)
        log('The number of requests remaining in the current rate limit window: %s', remaining)
        log('The number of requests you have made in the current rate limit window: %s', used)
        log('The time at which the current rate limit window resets, in UTC epoch seconds: %s', reset)
        log('The rate limit resource that the request counted against: %s', resource)
        try {
          const response = await res.text()
          log('%s', response)
        } catch {
          // ignore invalid respose
        }
          const wait = after || reset
        if (wait) {
          await delay(wait)
        }
      } else {
        try {
          const response = await res.text()
          log('%s', response)
        } catch {
          // ignore invalid respose
        }
      }
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

function getArchiveInfixes(platformSuffixes, archSuffixes) {
  const suffixes = getArchiveSuffixes(platformSuffixes, archSuffixes)
  return suffixes.map(suffix => suffix.slice(0, -4))
}

async function getGitHubRelease(name, repo, verspec, platformSuffixes, archSuffixes, token) {
  const suffixes = getArchiveSuffixes(platformSuffixes, archSuffixes)
  const archives = name && suffixes.map(suffix => `${name}${suffix}`)
  const url = `https://api.github.com/repos/${repo}/releases`
  const res = await fetchSafely(url, token)
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

function parseFileName(archive) {
  const match = /^(.+)-([^-]+)-([^-]+)_((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[.0-9A-Za-z-]+)?)\.zip$/.exec(archive)
  if (match) {
    const [, name, plat, arch, version] = match
    return { name, version, archive: `${name}-${plat}-${arch}.zip` }
  }
}

async function getCachedRelease(name, repo, verspec, platformSuffixes, archSuffixes) {
  const cacheDir = getCacheDir(repo)
  if (!await exists(cacheDir)) return {}
  const infixes = getArchiveInfixes(platformSuffixes, archSuffixes)
  const archives = name && infixes.map(infix => `${name}${infix}`)
  const pkgs = []
  for (const file of await readdir(cacheDir)) {
    if (archives) {
      if (archives.includes(file)) {
        const pkg = parseFileName(file)
        if (pkg) {
          if (valid(pkg.version) && (verspec === 'latest' || satisfies(pkg.version, verspec))) {
            log('match "%s", satisfactory', file)
            pkgs.push(pkg)
          } else {
            log('match "%s", unsatisfactory', file)
          }
        } else {
          log('match "%s", invalid', file)
        }
        continue
      }
    } else {
      const infix = infixes.find(infix => file.includes(infix))
      if (infix) {
        const pkg = parseFileName(file)
        if (pkg) {
          if (valid(pkg.version) && (verspec === 'latest' || satisfies(pkg.version, verspec))) {
            log('match by infix "%s", satisfactory', file)
            pkgs.push(pkg)
          } else {
            log('match by infix "%s", unsatisfactory', file)
          }
        } else {
          log('match by infix "%s", invalid', file)
        }
        continue
      }
    }
    log('skip "%s"', file)
  }
  if (pkgs.length) {
    pkgs.sort((left, right) => compare(left.version, right.version))
    const [pkg] = pkgs
    log('pick "%s"', pkg.archive)
    return pkg
  }
  log('nothing picked')
  return {}
}

function getCacheRoot() {
  return join(homedir(), '.cache/grabghr')
}

function getCacheDir(repo) {
  return join(getCacheRoot(), repo.replaceAll('/', '_'))
}

function getCachePath(cacheDir, version, archive) {
  const { ext, name } = parse(archive);
  return join(cacheDir, `${name}_${version}${ext}`)
}

async function checkCache(repo, version, archive) {
  const cacheDir = getCacheDir(repo)
  const cachePath = getCachePath(cacheDir, version, archive)
  log('check "%s"', cachePath)
  const hasCache = await exists(cachePath)
  return { hasCache, cacheDir, cachePath }
}

async function storeCache(cacheDir, cachePath, archivePath, copy) {
  log('ensure "%s"', cacheDir)
  await mkdir(cacheDir, { recursive: true })
  if (copy) {
    log('copy "%s" to "%s"', archivePath, cachePath)
    await copyFile(archivePath, cachePath)
  } else {
    try {
      log('rename "%s" to "%s"', archivePath, cachePath)
      await rename(archivePath, cachePath)
    /* c8 ignore next 6 */
    } catch {
      log('copy "%s" to "%s"', archivePath, cachePath)
      await copyFile(archivePath, cachePath)
      log('remove "%s"', archivePath)
      await unlink(archivePath)
    }
  }
}

async function removeCache(name) {
  let cacheDir = getCacheRoot()
  if (name) {
    cacheDir = join(cacheDir, name)
  }
  log('remove "%s"', cacheDir)
  await rm(cacheDir, { recursive: true, force: true })
}

async function download(url, archive, token) {
  const res = await fetchSafely(url, token)
  await new Promise((resolve, reject) => {
    const stream = Readable.fromWeb(res.body)
    stream
      .on('error', reject)
      .pipe(createWriteStream(archive))
      .on('finish', () => resolve())
      .on('error', reject)
  })
}

async function useCacheOrDownload(repo, version, url, archive, targetDirectory, temporary, cache, token) {
  const archivePath = targetDirectory ? join(targetDirectory, archive) : archive
  if (cache === false) {
    await download(url, archivePath, token)
    return { archivePath, fromCache: false }
  }
  const { hasCache, cacheDir, cachePath } = await checkCache(repo, version, archive)
  if (hasCache && targetDirectory) {
    log('copy "%s" to "%s"', cachePath, archivePath)
    await copyFile(cachePath, archivePath)
    return { archivePath, fromCache: false }
  }
  if (!hasCache) {
    await download(url, archivePath, token)
    const copy = !temporary || !!targetDirectory
    await storeCache(cacheDir, cachePath, archivePath, copy)
    if (copy) {
      return { archivePath, fromCache: false }
    }
  } else if (!temporary) {
    log('copy "%s" to "%s"', cachePath, archivePath)
    await copyFile(cachePath, archivePath)
    return { archivePath, fromCache: false }
  }
  return { archivePath: cachePath, fromCache: true }
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
  if (platform !== 'win32') {
    log('make "%s" executable', executable)
    await chmod(executable, 0o755)
  }
}

export async function grab({ name, repository, version, platformSuffixes, archSuffixes, targetDirectory, unpackExecutable, cache, forceCache, token, verbose }) {
  if (verbose) log = console.log.bind(console)
  if (!version) version = 'latest'
  const verspec = clean(version) || version
  let archive, url
  if (forceCache || env.GRABGHR_FORCE_CACHE) {
    ({ name, version, archive } = await getCachedRelease(name, repository, verspec, platformSuffixes, archSuffixes))
  }
  if (!archive) {
    ({ name, version, archive, url } = await getGitHubRelease(name, repository, verspec, platformSuffixes, archSuffixes, token))
  }
  const { archivePath, fromCache } = await useCacheOrDownload(repository, version, url, archive, targetDirectory, unpackExecutable, cache, token)
  if (unpackExecutable) {
    const executable = await unpack(archivePath, targetDirectory)
    await makeExecutable(executable)
    if (!fromCache) {
      log('remove "%s"', archivePath)
      await unlink(archivePath)
    }
    return { executable, version }
  }
  return { archive: archivePath, version }
}

export async function clearCache({ name, verbose } = {}) {
  if (verbose) log = console.log.bind(console)
  await removeCache(name)
}
