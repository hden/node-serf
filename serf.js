'use strict'

var net = require('net')
var debug = require('debug')('serf')
var msgpack = require('msgpack-js-v5-ng')
var Stream = require('./stream').Stream
var Decode = require('./msgpack').Decode
var util = require('util')

function camelize (str) {
  if (str === null) str = ''
  return str.trim().replace(/[-_\s]+(.)?/g, function (match, c) {
    return c === null ? '' : c.toUpperCase()
  })
}

function Serf (arg1) {
  if (!(this instanceof Serf)) {
    throw new Error('Class constructor cannot be invoked without "new"')
  }

  net.Socket.call(this, arg1)

  var _this = this
  this._seq = 0
  this._next = null
  var decoder = new Decode()
  this.pipe(decoder)

  this.once('connect', function () {
    debug('connected')
    return this.handshake({
      Version: 1
    })
  })

  decoder.on('data', function (obj) {
    debug('received %j', obj)

    if ((obj.Error !== null && obj.Error !== undefined) && obj.Error !== '') {
      var err = new Error(obj.Error)
      _this.emit('error', err)
    }

    if (obj.Seq) {
      return (_this._next = obj.Seq)
    } else {
      return _this.emit(_this._next, obj)
    }
  })

  this.once('end', function (d) {
    return debug('disconnected')
  })

  var commands = [
    'handshake',
    'event',
    'force-leave',
    'join',
    'members',
    'stream',
    'monitor',
    'stop',
    'leave',
    'tags',
    'stats'
  ]

  commands.forEach(function (command) {
    _this[command] = _this[camelize(command)] = function (body, cb) {
      return _this.send(command, body, cb)
    }
  })
}

util.inherits(Serf, net.Socket)

Serf.prototype.send = function (Command, body, cb) {
  if (Command === null) Command = ''

  var Seq = this._seq++

  var header = {
    Command: Command,
    Seq: Seq
  }

  if (typeof body === 'function') {
    cb = body
    body = {}
  }

  debug('sending header: %j', header)
  this.write(msgpack.encode(header))
  if (body !== null) {
    debug('sending body: %j', body)
    this.write(msgpack.encode(body))
  }

  if (Command === 'stream' || Command === 'monitor') {
    if (typeof cb === 'function') this.on(Seq, cb)

    var stream = new Stream(this, Seq)

    var ondata = function ondata (result) {
      return stream.emit('data', result)
    }
    this.on(Seq, ondata)

    var _this = this;
    stream.once('stop', function () {
      if (typeof cb === 'function') {
        _this.removeListener(Seq, cb)
      }
      return stream.removeListener('data', ondata)
    })

    return stream

  } else if (typeof cb === 'function') {
    this.once(Seq, cb)
  }
}

exports.connect = function connect () {
  var args = net._normalizeConnectArgs(arguments)
  debug('create connection with args: %j', args)
  var s = new Serf(args[0])
  Serf.prototype.connect.apply(s, args)
  return s
}
