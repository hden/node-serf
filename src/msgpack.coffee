'use strict'

{Transform} = require 'stream'

debug   = require('debug')('serf:msgpack')
msgpack = require 'msgpack-js-v5-ng'

class exports.Decode extends Transform
  constructor: ->
    super
    @_cache = new Buffer(0)
    @unpack = msgpack.decode
    @_writableState.objectMode = false
    @_readableState.objectMode = true
    @once 'end', ->
      debug 'ended'
  _transform: (chunk, enc, done) =>
    while chunk.length > 0
      popped = chunk.slice 0, 1
      chunk  = chunk.slice 1, chunk.length
      @_cache = Buffer.concat [@_cache, popped]
      try
        {value, trailing} = @unpack @_cache
      catch e
        debug 'faild to unpack with error: %s', e.message

      if trailing is 0
        @push value
        @_cache = new Buffer(0)

      break if chunk.length is 0

    do done
