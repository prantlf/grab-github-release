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
    external: ['debug', 'fs', 'os', 'path', 'semver', 'stream', 'yauzl'],
    plugins: [cleanup()]
  }
]
