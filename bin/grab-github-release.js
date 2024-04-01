#!/usr/bin/env node

import { grab, clearCache as clear } from '../dist/index.mjs'

function help() {
  console.log(`Generates a unique build number with a human-readable build time.

Usage: [options]

Options:
  --clear-cache                 clears the cache, optionally for a "name"
  -r|--repository <repository>  GitHub repository formatted "owner/name"
  -i|--version-spec <semver>    semantic version specifier or "latest"
  -n|--name <file-name>         archive name without the platform suffix
  -p|--platform-suffixes <map>  platform name mapping
  -a|--arch-suffixes <map>      architecture name mapping
  -t|--target-dir <dir-name>    directory to write the output files to
  -e|--unpack-exe               unpack the executable and remove the archive
  -c|--cache                    use ~/.cache/grabghr as cache
  --force-cache                 use the cache to discover the latest version
  -g|--gh-token <token>         GitHub authentication token
  -v|--verbose                  prints extra information on the console
  -V|--version                  print version number and exit
  -h|--help                     print usage instructions and exit

The version specifier is "latest" by default. The file name will be inferred
from the first archive asset found for the current platform, if not specified.
If GitHub token is not specified, variables GITHUB_TOKEN and GH_TOKEN in the
process environment will be checked too.

Examples:
  $ grab-github-release -r prantlf/v-jsonlint -p darwin=macos,win32=windows:win64 -u
  $ grab-github-release -r prantlf/v-jsonlint -i >=0.0.6`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

const { argv } = process
let   clearCache, repository, version, name, platformSuffixes, archSuffixes,
      targetDirectory, unpackExecutable, cache, forceCache, token, verbose

for (let i = 2, l = argv.length; i < l; ++i) {
  const arg = argv[i]
  const match = /^(-|--)(no-)?([a-zA-Z][-a-zA-Z]*)(?:=(.*))?$/.exec(arg)
  if (match) {
    const parseArg = async (arg, flag) => {
      let entries
      switch (arg) {
        case 'clear-cache':
          clearCache = flag
          return
        case 'r': case 'repository':
          repository = match[4] || argv[++i]
          return
        case 'i': case 'version':
          version = match[4] || argv[++i]
          return
        case 'n': case 'name':
          name = match[4] || argv[++i]
          return
        case 'p': case 'platform-suffixes':
          entries = match[4] || argv[++i]
          if (!entries) fail('missing platform suffix map')
          if (!platformSuffixes) platformSuffixes = {}
          for (const entry of entries.trim().split(',')) {
            const [key, val] = entry.trim().split('=')
            platformSuffixes[key.trim()] = val.trim().split(':').map(val => val.trim())
          }
          return
        case 'a': case 'arch-suffixes':
          entries = match[4] || argv[++i]
          if (!entries) fail('missing architecture suffix map')
          if (!archSuffixes) archSuffixes = {}
          for (const entry of entries.trim().split(',')) {
            const [key, val] = entry.trim().split('=')
            archSuffixes[key.trim()] = val.trim().split(':').map(val => val.trim())
          }
          return
        case 't': case 'target-dir':
          targetDirectory = match[4] || argv[++i]
          return
        case 'e': case 'unpack-exe':
          unpackExecutable = flag
          return
        case 'c': case 'cache':
          cache = flag
          return
        case 'force-cache':
          forceCache = flag
          return
        case 'g': case 'gh-token':
          token = match[4] || argv[++i]
          return
        case 'v': case 'verbose':
          verbose = flag
          return
        case 'V': case 'version-spec':
          {
            const { readFile } = await import('fs/promises')
            const { fileURLToPath } = await import('url')
            const { join, dirname } = await import('path')
            const pkg = join(dirname(fileURLToPath(import.meta.url)), '../package.json')
            console.log(JSON.parse(await readFile(pkg, 'utf8')).version)
            process.exit(0)
          }
          break
        case 'h': case 'help':
          help()
          process.exit(0)
      }
      fail(`unknown option: "${arg}"`)
    }
    if (match[1] === '-') {
      const flags = match[3].split('')
      for (const flag of flags) await parseArg(flag, true)
    } else {
      await parseArg(match[3], match[2] !== 'no-')
    }
    continue
  }
  fail(`unrecognized argument: "${arg}"`)
}

if (!repository) {
  if (argv.length > 2) fail('missing repository')
  help()
  process.exit(0)
}

try {
  if (clearCache) {
    await clear({ repository, verbose })
  } else {
    await grab({
      repository,
      version,
      name,
      platformSuffixes,
      archSuffixes,
      targetDirectory,
      unpackExecutable,
      cache,
      forceCache,
      token,
      verbose
    })
  }
} catch(err) {
  console.error(err.message)
  process.exitCode = 1
}
