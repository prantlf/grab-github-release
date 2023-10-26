# Grab GitHub Release

[![Latest version](https://img.shields.io/npm/v/grab-github-release)
 ![Dependency status](https://img.shields.io/librariesio/release/npm/grab-github-release)
](https://www.npmjs.com/package/grab-github-release)
[![Coverage](https://codecov.io/gh/prantlf/grab-github-release/branch/master/graph/badge.svg)](https://codecov.io/gh/prantlf/grab-github-release)

Downloads and optionally unpacks an archive from GitHub release assets for the current platform.

## Synopsis

```js
import grab from 'grab-github-release'

try {
  const repository = 'prantlf/v-jsonlint'
  const platformSuffixes = {
    darwin: 'macos',
    win32: 'windows'
  }
  // downloads and unpacks the jsonlint executable to the current directory
  await grab({ repository, platformSuffixes, unpackExecutable: true })
} catch(err) {
  console.error(err.message)
  process.exitCode = 1
}
```

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
      $ grab-github-release -r prantlf/v-jsonlint -i >=0.0.6

## API

```ts
// map where keys are Node.js platform names and values are their replacements
// to be used in names of archive looked for among  GitHub release assets
type PlatformSuffixes = Record<string, string>

interface GrabOptions {
  // GitHub repository formatted "owner/name", mandatory
  repository: string
  // semantic version specifier or "latest"; defaults to "latest", if unspecified
  version?: string
  // archive name without the platform and architecture suffix
  // and without the ".zip" extension as well
  name?: string
  // archive name without the platform suffix; if not specified, it will be
  // inferred from the first archive asset found for the current platform
  platformSuffixes?: PlatformSuffixes
  // unpack the executable and remove the archive
  unpackExecutable?: boolean
}

interface GrabResult {
  // actual version number as specified or picked from the list of releases
  version: string
  // downloaded archive name, if not removed (and the executable not unpacked)
  archive?: string
  // executable file name, if it was unpacked (and the archive removed)
  executable?: string
}

// downloads and optionally unpacks an archive from GitHub release assets
// for the current platform
export default function grab(options: GrabOptions): GrabResult
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.  Add unit tests for any new or changed functionality. Lint and test your code using Grunt.

## License

Copyright (c) 2023 Ferdinand Prantl

Licensed under the MIT license.

[Node.js]: http://nodejs.org/
