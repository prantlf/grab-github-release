const { ok } = require('assert')
const exported = require('../dist/index.cjs')

ok(exported)
ok(typeof exported === 'object')
ok(typeof exported.grab === 'function')
ok(typeof exported.clearCache === 'function')
