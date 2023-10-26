#!/usr/bin/env node

import grab from '../dist/index.mjs'

function help() {
  console.log(`Generates a unique build number with a human-readable build time.

Usage: [options]

Options:
  -r|--repository <repository>  GitHub repository formatted "owner/name"
  -i|--version-spec <semver>    semantic version specifier or "latest"
  -n|--name <file-name>         archive name without the platform suffix
  -p|--platform-suffixes <map>  unpack the executable and remove the archive
  -e|--unpack-exe               unpack the executable and remove the archive
  -v|--verbose                  prints extra information on the console
  -V|--version                  print version number and exit
  -h|--help                     print usage instructions and exit

The version specifier is "latest" by default. The file name will be inferred
from the first archive asset found for the current platform, if not specified.

Examples:
  $ grab-github-release -r prantlf/v-jsonlint -p darwin=macos,win32=windows -u
  $ grab-github-release -r prantlf/v-jsonlint -i >=0.0.6`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

const { argv } = process
let   repository, version, name, platformSuffixes, unpackExecutable, verbose

for (let i = 2, l = argv.length; i < l; ++i) {
  const arg = argv[i]
  const match = /^(-|--)(no-)?([a-zA-Z][-a-zA-Z]*)(?:=(.*))?$/.exec(arg)
  if (match) {
    const parseArg = async (arg, flag) => {
      let entries
      switch (arg) {
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
            platformSuffixes[key.trim()] = val.trim()
          }
          return
        case 'e': case 'unpack-exe':
          unpackExecutable = flag
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
  await grab({ repository, version, name, platformSuffixes, unpackExecutable, verbose })
} catch(err) {
  console.error(err.message)
  process.exitCode = 1
}
