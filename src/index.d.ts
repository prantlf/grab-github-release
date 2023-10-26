/**
 * map where keys are Node.js platform names and values are their replacements
 * to be used in names of archive looked for among  GitHub release assets
 */
type PlatformSuffixes = Record<string, string>

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
   * archive name without the platform suffix; if not specified, it will be
   * inferred from the first archive asset found for the current platform
   */
  platformSuffixes?: PlatformSuffixes
  /**
   * unpack the executable and remove the archive
   */
  unpackExecutable?: boolean
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

/**
 * downloads and optionally unpacks an archive from GitHub release assets
 * for the current platform
 * 
 * @param options see properties of `GrabOptions` for more information
 */
export default function grab(options: GrabOptions): GrabResult
