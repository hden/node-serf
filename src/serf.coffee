'use strict'

{EventEmitter} = require 'events'
{exec}         = require 'child_process'
stream         = require 'stream'
net            = require 'net'

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

print = (d) ->
  return unless d?
  if _.isString d
    debug d
  else
    try
      debug JSON.stringify d, null, 4
    catch error
      debug 'circular structure!'

class exports.Serf extends net.Socket
  constructor: ->
    super
    @_seq = 0
    @_cache = ''
    @decoder = new msgpack.Stream @

    @once 'connect', (d) ->
      print 'connected'
      @handshake {Version: 1}

    @decoder.on 'msg', (obj) =>
      @emit obj.Seq, obj
      {Error} = obj
      @emit 'error', Error if (Error? and Error isnt '')
      print obj

    @once 'end', (d) ->
      print 'disconnected'

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
      body = undefined

    print 'header'
    print header
    print 'body'
    print body
    @write msgpack.pack header
    @write msgpack.pack body or {}
    @once Seq, cb if cb?
    @

exports.connect = ->
  args = net._normalizeConnectArgs arguments
  print 'createConnection', args
  s = new exports.Serf args[0]
  exports.Serf::connect.apply s, args
  s
