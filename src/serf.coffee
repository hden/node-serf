'use strict'

net     = require 'net'

debug   = require('debug')('serf')
_       = require 'underscore'
msgpack = require 'msgpack'

capitalize = (str = '') ->
  if _.isString str
    str.charAt(0).toUpperCase() + str.slice(1)
  else if _.isObject str
    res = {}
    for k, v of str
      res[capitalize(k)] = if v.charAt(0).match(/[a-z]/) then capitalize(v) else v
    return res
  else
    str

camelize = (str = '') ->
  str.trim().replace /[-_\s]+(.)?/g, (match, c) ->
    if c? then c.toUpperCase() else ''

class exports.Serf extends net.Socket
  constructor: ->
    super
    @_seq = 0
    # @decoder = new msgpack.Stream @

    # @decoder.on 'error', console.error.bind console

    @once 'connect', (d) ->
      debug 'connected'
      @handshake {Version: 1}

    # @decoder.on 'msg', (obj) =>
    #   @emit obj.Seq, obj
    #   @emit 'error', new Error(obj.Error) if (obj.Error? and obj.Error isnt '')
    @on 'data', (packed) ->
      msg = msgpack.unpack packed
      @emit msg.Seq, msg
      debug 'unpacked result %j', msg
      @emit 'error', new Error(msg.Error) unless msg.Error is ''

    @once 'end', (d) ->
      debug 'disconnected'

    commands = [
      'handshake'
      'event'
      'force-leave'
      'join'
      'members'
      'stream'
      'monitor'
      'stop'
      'leave'
    ]

    commands.forEach (command) =>
      @[command] = (body, cb) =>
        @send command, body, cb

  send: (Command = '', body, cb) =>
    Seq = @_seq++

    header = {Command, Seq}

    if _.isFunction body
      cb = body
      body = {}

    debug 'sending header: %j', header
    debug 'sending body: %j', body
    # @decoder.send header
    # @decoder.send body if body?
    @write msgpack.pack header
    @write msgpack.pack body if body?
    @once Seq, cb if cb?
    @

exports.connect = ->
  args = net._normalizeConnectArgs arguments
  debug 'create connection with args: %j', args
  s = new exports.Serf args[0]
  exports.Serf::connect.apply s, args
  s
