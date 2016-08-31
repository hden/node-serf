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

function expectBody (seq) {
  return seq % 2 === 0
}

var ids = 0

function Serf (arg1) {
  if (!(this instanceof Serf)) {
    throw new Error('Class constructor cannot be invoked without "new"')
  }

  net.Socket.call(this, arg1)

  var _this = this
  this._id = ids++;
  // Even-numbered sequences have no response body; odds do.
  this._seqBody = 0
  this._seqNoBody = 1
  this._next = null
  var decoder = new Decode()
  this.pipe(decoder)

  decoder.on('data', function (obj) {
    debug('[%j] received %j', _this._id, obj)

    var Seq = obj.Seq
    if (Seq !== undefined) {
      // Header

      if ((obj.Error !== null && obj.Error !== undefined) && obj.Error !== '') {
        var err = new Error(obj.Error)
        return _this.emit(Seq, err)
      }

      if (expectBody(Seq)) {
        _this._next = obj.Seq
      } else {
        _this.emit(Seq, null)
      }

    } else {
      // Body
      _this.emit(_this._next, null, obj)
    }
  })

  this.once('end', function () {
    return debug('[%j] disconnected', _this._id)
  })

  var commands = [
    {name: 'handshake', hasResponse: false},
    {name: 'auth', hasResponse: false},
    {name: 'event', hasResponse: false},
    {name: 'force-leave', hasResponse: false},
    {name: 'join', hasResponse: true},
    {name: 'members', hasResponse: true},
    {name: 'members-filtered', hasResponse: true},
    {name: 'tags', hasResponse: false},
    {name: 'stream', hasResponse: true},
    {name: 'monitor', hasResponse: true},
    {name: 'stop', hasResponse: false},
    {name: 'query', hasResponse: true},
    {name: 'respond', hasResponse: false},
    {name: 'install-key', hasResponse: true},
    {name: 'use-key', hasResponse: true},
    {name: 'remove-key', hasResponse: true},
    {name: 'list-keys', hasResponse: true},
    {name: 'stats', hasResponse: true},
    {name: 'get-coordinate', hasResponse: true}
  ]

  commands.forEach(function (command) {
    var commandName = command.name
    var hasResponse = command.hasResponse
    _this[commandName] = _this[camelize(commandName)] = function (body, cb) {
      return _this.send(commandName, hasResponse, body, cb)
    }
  })
}

util.inherits(Serf, net.Socket)

Serf.prototype.leave = function () {
  var Seq = this._seqNoBody += 2

  var header = {
    Command: 'leave',
    Seq: Seq
  }

  this.end(msgpack.encode(header))
}

Serf.prototype.send = function (Command, hasResponse, body, cb) {
  if (Command === null) Command = ''

  var Seq
  if (hasResponse) {
    Seq = this._seqBody += 2
  } else {
    Seq = this._seqNoBody += 2
  }

  var header = {
    Command: Command,
    Seq: Seq
  }

  if (typeof body === 'function') {
    cb = body
    body = {}
  }

  // Setup listeners
  var stream
  if (Command === 'stream' || Command === 'monitor' || Command === 'query') {
    if (typeof cb === 'function') this.on(Seq, cb)

    stream = new Stream(this, Seq)

    var ondata = function ondata (err, result) {
      if (err) {
        stream.emit('error', err)
      } else {
        stream.emit('data', result)
      }
    }
    this.on(Seq, ondata)

    var _this = this;
    stream.once('stop', function () {
      if (typeof cb === 'function') {
        _this.removeListener(Seq, cb)
      }
      return stream.removeListener('data', ondata)
    })
  } else if (typeof cb === 'function') {
    this.once(Seq, cb)
  }

  // Send message
  debug('[%j] sending header: %j', this._id, header)
  this.write(msgpack.encode(header))
  if (body !== null) {
    debug('[%j] sending body: %j', this._id, body)
    this.write(msgpack.encode(body))
  }

  if (stream) return stream;
}

exports.connect = function connect () {
  var argsLen = arguments.length
  var args = new Array(argsLen)
  for (var i = 0; i < argsLen; i++) {
    args[i] = arguments[i]
  }

  if (typeof args[0] === 'function') {
    // Default
    args.unshift({
      port: 7373
    })
  }

  args = net._normalizeConnectArgs(args)
  debug('create connection with args: %j', args)

  var s = new Serf(args[0])

  var onHandshake = typeof args[args.length - 1] === 'function'
    ? args.pop()
    : function () {}

  // Pass errors from the connection phase to the callback.
  s.on('error', onHandshake)

  var doHandshake = function () {
    debug('[%j] connected', s._id)
    s.removeListener('error', onHandshake)
    s.handshake({
      Version: 1
    }, onHandshake)
  }
  args.push(doHandshake)

  Serf.prototype.connect.apply(s, args)
  return s
}
