import { grab, clearCache } from 'grab-github-release'

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
      linux: [''],
      darwin: [''],
      win32: ['']
    },
    archSuffixes: {
      arm64: [''],
      riscv64: [''],
      x64: ['']
    },
    targetDirectory: '',
    unpackExecutable: true,
    cache: true,
    forceCache: true,
    token: '',
    verbose: true
  })

  clearCache()

  clearCache({
    repository: '',
    verbose: true
  })
})
