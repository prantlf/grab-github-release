/**
 * map where keys are Node.js platform names and values are their replacements
 * to be used in names of archive looked for among  GitHub release assets
 */
type ArchiveSuffixes = Record<string, string[]>

interface GrabOptions {
  /**
   * GitHub repository formatted "owner/name", mandatory
   */
  repository: string
  /**
   * semantic version specifier or "latest"; defaults to "latest", if unspecified
   */
  version?: string
  /**
   * archive name without the platform and architecture suffix
   * and without the ".zip" extension as well
   */
  name?: string
  /**
   * recognised platforms organised by the Node.js platform name; defaults:
   * - darwin: darwin, macos
   * - linux: linux
   * - win32: win32, windows
   */
  platformSuffixes?: ArchiveSuffixes
  /**
   * recognised architectures organised by the Node.js platform name; defaults:
   * - arm64: aarch64, arm64
   * - x64: amd64, x86_64, x64, x86
   */
  archSuffixes?: ArchiveSuffixes
  /**
   * directory to write the archive or executable to; if not specified,
   * files will be written to the current directory
   */
  targetDirectory?: string
  /**
   * unpack the executable and remove the archive
   */
  unpackExecutable?: boolean
  /**
   * store the downloaded archives from GitHub releases to the cache
   * in ~/.cache/grabghr; `true` is the default
   */
  cache?: boolean
  /**
   * force using the cache for getting the last available version and avoid
   * connecting to GitHub if the cache isn't empty
   */
  forceCache?: boolean
  /**
   * GitHub authentication token, overrides the environment variables
   * GITHUB_TOKEN or GH_TOKEN
   */
  token?: string
  /**
   * print details about the program execution
   */
  verbose?: boolean
}

interface GrabResult {
  /**
   * actual version number as specified or picked from the list of releases
   */
  version: string
  /**
   * downloaded archive name, if not removed (and the executable not unpacked)
   */
  archive?: string
  /**
   * executable file name, if it was unpacked (and the archive removed)
   */
  executable?: string
}

interface ClearCacheOptions {
  /**
   * GitHub repository formatted "owner/name", mandatory
   */
  repository: string
  /**
   * print details about the program execution
   */
  verbose?: boolean
}

/**
 * downloads and optionally unpacks an archive from GitHub release assets
 * for the current platform
 * 
 * @param options see properties of `GrabOptions` for more information
 */
export function grab(options: GrabOptions): Promise<GrabResult>

/**
 * clears the cache used for downloading archives from GitHub releases
 * 
 * @param options see properties of `ClearCacheOptions` for more information
 */
export function clearCache(options?: ClearCacheOptions): Promise<void>
