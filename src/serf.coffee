'use strict'

net      = require 'net'

debug    = require('debug')('serf')
_        = require 'underscore'
msgpack  = require 'msgpack-js-v5-ng'

{Stream} = require "#{__dirname}/stream"
{Decode} = require "#{__dirname}/msgpack"

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
    @_seq    = 0
    @_next   = undefined
    @decoder = new Decode()

    @pipe @decoder

    @once 'connect', (d) ->
      debug 'connected'
      @handshake {Version: 1}

    @decoder.on 'data', (obj) =>
      debug 'recieved %j', obj
      @emit 'error', new Error(obj.Error) if (obj.Error? and obj.Error isnt '')

      if obj.Seq
        @_next = obj.Seq
      else
        @emit @_next, obj

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
      'tags'
      'stats'
    ]

    commands.forEach (command) =>
      @[command] =
      @[camelize command] =
        (body, cb) =>
          @send command, body, cb

  send: (Command = '', body, cb) =>
    Seq = @_seq++

    header = {Command, Seq}

    if _.isFunction body
      cb = body
      body = {}

    debug 'sending header: %j', header
    debug 'sending body: %j', body
    @write msgpack.encode header
    @write msgpack.encode body if body?

    if Command in ['stream', 'monitor']
      @on Seq, cb if cb?

      stream = new Stream(@, Seq)

      ondata = (result) ->
        stream.emit 'data', result

      @on Seq, ondata

      stream.once 'stop', =>
        @removeListener Seq, cb if cb?
        stream.removeListener 'data', ondata

      return stream
    else if cb?
      @once Seq, cb

    @

exports.connect = ->
  args = net._normalizeConnectArgs arguments
  debug 'create connection with args: %j', args
  s = new exports.Serf args[0]
  exports.Serf::connect.apply s, args
  s
