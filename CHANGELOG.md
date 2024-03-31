# [1.0.0](https://github.com/prantlf/grab-github-release/compare/v0.2.3...v1.0.0) (2024-03-31)


### Bug Fixes

* Upgrade depednencies ([4af2502](https://github.com/prantlf/grab-github-release/commit/4af2502a4b47af202088e6bb887c08bfcb63355c))
* Use command-line args targetDirectory and token ([edf3d57](https://github.com/prantlf/grab-github-release/commit/edf3d57dae96c965e925356a1546f6ddf60c190d))


### Features

* Add function and command-line option for clearing cache ([0d5ba64](https://github.com/prantlf/grab-github-release/commit/0d5ba64d54c983ed1c20159ec23dbf8108bd2f04))
* Save downloaded zip files to cache for being used next ([6c3bf05](https://github.com/prantlf/grab-github-release/commit/6c3bf0592e9bdfe0ee121310ddb2a9a054385d2c))


### BREAKING CHANGES

* The package exports only named exports from now on.
If you imported the function `grab` as a default export, import it
by the name `grab` as a named export from now on. The command-line
tool works as it did with no breaking change.
* Although caching the archives downloaded from GitHub
releases to ~/.cache/grabghr by default should be transparent and should
not affect any usage scenario, it might influence the speed or disk
usage of a particular application. That is why this is formally declared
as a breaking change.

## [0.2.3](https://github.com/prantlf/grab-github-release/compare/v0.2.2...v0.2.3) (2023-12-13)


### Bug Fixes

* Log if the GitHub API call was authorized ([1ab57ea](https://github.com/prantlf/grab-github-release/commit/1ab57ea51f9f0cba263a562b6ffc820aec3f3cb6))

## [0.2.2](https://github.com/prantlf/grab-github-release/compare/v0.2.1...v0.2.2) (2023-12-13)


### Bug Fixes

* Add GitHub API version header ([66c2ab8](https://github.com/prantlf/grab-github-release/commit/66c2ab8a10e3a28773a32230262941c77c025be2))
* Wait until the GitHub API rate limit allows the next request ([f995aaa](https://github.com/prantlf/grab-github-release/commit/f995aaa38ca33d0bf7e7ea64df0e3c4c547f3304))

## [0.2.1](https://github.com/prantlf/grab-github-release/compare/v0.2.0...v0.2.1) (2023-12-13)


### Bug Fixes

* Authorize fetches to overccome GitHub API rate limit ([061abf8](https://github.com/prantlf/grab-github-release/commit/061abf88714b35e3bcc035f40ce3619bca9b28d3))

# [0.2.0](https://github.com/prantlf/grab-github-release/compare/v0.1.1...v0.2.0) (2023-12-12)


### Features

* Allow mapping of architectures too ([8d61855](https://github.com/prantlf/grab-github-release/commit/8d6185566c41a3b8c77d00fd7058a445ba1bf77c))

## [0.1.1](https://github.com/prantlf/grab-github-release/compare/v0.1.0...v0.1.1) (2023-10-27)


### Bug Fixes

* Do not try processing failed requests ([674a735](https://github.com/prantlf/grab-github-release/commit/674a73598a635de4b6084af36bd82855383eaac8))
* Wait 5-10s between failing network requet attempts ([054e377](https://github.com/prantlf/grab-github-release/commit/054e377cf119cdcc16d8a6d036ac221018c15b93))

# [0.1.0](https://github.com/prantlf/grab-github-release/compare/v0.0.1...v0.1.0) (2023-10-26)


### Features

* Allow setting the target directory to write ouptut files to ([88b2f14](https://github.com/prantlf/grab-github-release/commit/88b2f145be7405a1967d170a67f4fbe9d61d1b23))

# Changes

## 2023-10-26 (0.0.1)

Initial release
