const { ok } = require('assert')
const grab = require('../dist/index.cjs')

ok(typeof grab === 'function')
