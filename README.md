# Grab GitHub Release

[![Latest version](https://img.shields.io/npm/v/grab-github-release)
 ![Dependency status](https://img.shields.io/librariesio/release/npm/grab-github-release)
](https://www.npmjs.com/package/grab-github-release)
[![Coverage](https://codecov.io/gh/prantlf/grab-github-release/branch/master/graph/badge.svg)](https://codecov.io/gh/prantlf/grab-github-release)

Downloads and optionally unpacks an archive from GitHub release assets for the current platform.

If used to install a binary executable to a NPM package, [link-bin-executable] can help.

## Synopsis

```js
import { grab } from 'grab-github-release'

try {
  const repository = 'prantlf/v-jsonlint'
  // downloads and unpacks the jsonlint executable to the current directory
  await grab({ repository, unpackExecutable: true })
} catch(err) {
  console.error(err.message)
  process.exitCode = 1
}
```

The archive with the executable is expected to be:

    {name}-{platform}-{architecture}.zip

where:

* `{name}` is the name of the tool (executable)
* `{platform}` is the name of the target platform, by default: `linux`, `macos` or `windows`
* `{architecture}` is the name of the targetarchitecture, by default `aarch64` or `arm64` (64-bit ARM), `amd64`, `x86_64`, `x64` or `x86` (64-bit AMD)

## Installation

This package can be installed globally, if you want to use the `grab-github-release` script (or the `ggr` alias). You can install it during the first usage with `npx` too:

```sh
$ npm i -g grab-github-release
$ npx grab-github-release ...
```

This package can be installed locally too, if you want to use it programmatically:

```sh
$ npm i -g grab-github-release
$ npx grab-github-release ...
```

Make sure, that you use [Node.js] version 18 or newer.

## Command-line Usage

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
      $ grab-github-release -r prantlf/v-jsonlint -i >=0.0.6

## API

```ts
// map where keys are Node.js platform names and values are their replacements
// to be used in names of archive looked for among  GitHub release assets
type ArchiveSuffixes = Record<string, string[]>

interface GrabOptions {
  // GitHub repository formatted "owner/name", mandatory
  repository: string
  // semantic version specifier or "latest"; defaults to "latest", if unspecified
  version?: string
  // archive name without the platform and architecture suffix
  // and without the ".zip" extension as well
  name?: string
  // recognised platforms organised by the Node.js platform name; defaults:
  // - darwin: darwin, macos
  // - linux: linux
  // - win32: win32, windows
  platformSuffixes?: ArchiveSuffixes
  // recognised architectures organised by the Node.js platform name; defaults:
  // - arm64: aarch64, arm64
  // - x64: amd64, x86_64, x64, x86
  archSuffixes?: ArchiveSuffixes
  // directory to write the archive or executable to; if not specified,
  // files will be written to the current directory
  targetDirectory?: string
  // unpack the executable and remove the archive
  unpackExecutable?: boolean
  // store the downloaded archives from GitHub releases to the cache
  // in ~/.cache/grabghr; `true` is the default
  cache?: boolean
  // force using the cache for getting the last available version and avoid
  // connecting to GitHub if the cache isn't empty
  forceCache?: boolean
  // GitHub authentication token, overrides the environment variables
  // GITHUB_TOKEN or GH_TOKEN
  token?: string
  // print details about the program execution
  verbose?: boolean
}

interface GrabResult {
  // actual version number as specified or picked from the list of releases
  version: string
  // downloaded archive name, if not removed (and the executable not unpacked)
  archive?: string
  // executable file name, if it was unpacked (and the archive removed)
  executable?: string
}

interface ClearCacheOptions {
  // GitHub repository formatted "owner/name", mandatory
  repository: string
  // print details about the program execution
  verbose?: boolean
}

// downloads and optionally unpacks an archive from GitHub release assets
// for the current platform
export function grab(options: GrabOptions): Promise<GrabResult>

// clears the cache used for downloading archives from GitHub releases
export function clearCache(options?: ClearCacheOptions): Promise<void>
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.  Add unit tests for any new or changed functionality. Lint and test your code using Grunt.

## License

Copyright (c) 2023-2024 Ferdinand Prantl

Licensed under the MIT license.

[Node.js]: http://nodejs.org/
[link-bin-executable]: https://github.com/prantlf/link-bin-executable
