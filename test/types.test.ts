import grab from 'grab-github-release'

declare type testCallback = () => void
declare function test (label: string, callback: testCallback)

test('Type declarations for TypeScript', () => {
  grab({
    repository: ''
  })

  grab({
    repository: '',
    name: '',
    version: '',
    platformSuffixes: {
      linux: '',
      darwin: '',
      win32: ''
    },
    unpackExecutable: true
  })
})
