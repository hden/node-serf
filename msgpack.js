'use strict'

var Transform = require('stream').Transform
var debug = require('debug')('serf:msgpack')
var msgpack = require('msgpack-js-v5-ng')
var util = require('util')

function createEmptyBuffer() {
  // `new Buffer()` is deprecated; Buffer.allocUnsafe available in 5.10.0+
  return Buffer.allocUnsafe ? Buffer.allocUnsafe(0) : new Buffer(0)
}

function Decode() {
  Transform.call(this, arguments)
  this._cache = createEmptyBuffer()
  this.unpack = msgpack.decode
  this._writableState.objectMode = false
  this._readableState.objectMode = true
  this.once('end', function() {
    return debug('ended')
  })
}

util.inherits(Decode, Transform)

Decode.prototype._transform = function (chunk, enc, done) {
  while (chunk.length > 0) {
    var popped = chunk.slice(0, 1)
    chunk = chunk.slice(1, chunk.length)
    this._cache = Buffer.concat([this._cache, popped])

    var trailing
    var value
    try {
      var _ref = this.unpack(this._cache)
      value = _ref.value
      trailing = _ref.trailing
    } catch (_error) {
      var e = _error
      debug('failed to unpack with error: %s', e.message)
    }

    if (trailing === 0) {
      this.push(value)
      this._cache = createEmptyBuffer()
    }

    if (chunk.length === 0) break
  }
  done()
}

exports.Decode = Decode
