'use strict'

var EventEmitter = require('events').EventEmitter
var util = require('util')

function Stream (client, seq) {
  EventEmitter.call(this, arguments)
  this._client = client
  this._seq = seq
}

util.inherits(Stream, EventEmitter)

Stream.prototype.stop = function (cb) {
  if (typeof cb !== 'function') cb = function () {}
  this._client.stop({
    Stop: this._seq
  }, cb)
  var _this = this
  return process.nextTick(function () {
    return _this.emit('stop')
  })
}

exports.Stream = Stream
