import cleanup from 'rollup-plugin-cleanup'

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.mjs',
        sourcemap: true
      }
    ],
    external: [
      'debug', 'node:fs', 'node:os', 'node:path', 'semver', 'node:stream',
      'yauzl'
    ],
    plugins: [cleanup()]
  }
]
