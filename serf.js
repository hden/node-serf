'use strict'

var net = require('net')
var debug = require('debug')('serf')
var msgpack = require('msgpack-lite')
var Stream = require('./stream').Stream
var util = require('util')

function camelize (str) {
  if (str === null) str = ''
  return str.trim().replace(/[-_\s]+(.)?/g, function (match, c) {
    return c === null ? '' : c.toUpperCase()
  })
}

function expectBody (seq) {
  return seq % 3 === 0
}

function isStream (seq) {
  return (seq - 2) % 3 === 0
}

var ids = 0

function Serf (arg1) {
  if (!(this instanceof Serf)) {
    throw new Error('Class constructor cannot be invoked without "new"')
  }

  net.Socket.call(this, arg1)

  var _this = this
  this._id = ids++
  // Sequence controls the type of respond handling
  this._seqBody = 0 // 3, 6, 9...
  this._seqNoBody = 1 // 4, 7, 10...
  this._seqStream = 2 // 5, 8, 11...
  // Map of sequences that are in body phase
  _this._bodyPhaseStreamSeqs = {}
  function isStreamInBodyPhase (seq) {
    return isStream(seq) && _this._bodyPhaseStreamSeqs[seq]
  }
  this._next = null
  var decoder = msgpack.createDecodeStream()
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

      if (expectBody(Seq) || isStreamInBodyPhase(Seq)) {
        _this._next = Seq
      } else {
        if (isStream(Seq)) _this._bodyPhaseStreamSeqs[Seq] = true
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
    {name: 'stop', hasResponse: false},
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

  var streamingCommands = [
    {name: 'stream'},
    {name: 'monitor'},
    {name: 'query'}
  ]

  streamingCommands.forEach(function (command) {
    var commandName = command.name
    _this[commandName] = _this[camelize(commandName)] = function (body, cb) {
      return _this.sendStream(commandName, body, cb)
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

Serf.prototype.sendStream = function (Command, body, cb) {
  var Seq = this._seqStream += 3

  var header = {
    Command: Command,
    Seq: Seq
  }

  var stream = new Stream(this, Seq)

  var ondata = function ondata (err, result) {
    if (err) {
      stream.emit('error', err)
    } else {
      stream.emit('data', result)
      if (Command === 'query' && result.Type === 'done') {
        stream.emit('stop')
      }
    }
  }

  // Call the listen callback/emit 'listen' first, then bind 'ondata' instead.
  this.once(Seq, function (err) {
    stream.emit('listen', err)
    this.on(Seq, ondata)
    if (typeof cb === 'function') cb(err)
  })

  var _this = this
  stream.once('stop', function () {
    if (typeof cb === 'function') {
      _this.removeListener(Seq, cb)
    }
    stream.removeListener('data', ondata)
    delete _this._bodyPhaseStreamSeqs[Seq]
  })

  dowrite(this, header, body)

  return stream
}

Serf.prototype.send = function (Command, hasResponse, body, cb) {
  if (Command === null) Command = ''

  if (typeof body === 'function') {
    cb = body
    body = null
  }

  var Seq = hasResponse ? (this._seqBody += 3) : (this._seqNoBody += 3)

  var header = {
    Command: Command,
    Seq: Seq
  }

  var _this = this
  return new Promise(function (resolve, reject) {
    if (typeof cb === 'function') {
      _this.once(Seq, cb)
    } else {
      _this.once(Seq, function (err, response) {
        if (err) reject(err)
        else resolve(response)
      })
    }

    dowrite(_this, header, body)
  })
}

function dowrite (client, header, body) {
  debug('[%j] sending header: %j', client._id, header)
  client.write(msgpack.encode(header))
  if (body !== null) {
    debug('[%j] sending body: %j', client._id, body)
    client.write(msgpack.encode(body))
  }
}

/*
 * normalizeConnectArgs, isPipeName & toNumber have been extracted from the
 * Node.js source, as it's an undocumented API and this ensures future
 * compatability. All credit goes to the Node.js team.
 */

function toNumber (x) { return (x = Number(x)) >= 0 ? x : false }

function isPipeName (s) {
  return typeof s === 'string' && toNumber(s) === false
}

function normalizeConnectArgs (args) {
  var options = {}

  if (args.length === 0) {
    return [options]
  } else if (args[0] !== null && typeof args[0] === 'object') {
    // connect(options, [cb])
    options = args[0]
  } else if (isPipeName(args[0])) {
    // connect(path, [cb]);
    options.path = args[0]
  } else {
    // connect(port, [host], [cb])
    options.port = args[0]
    if (args.length > 1 && typeof args[1] === 'string') {
      options.host = args[1]
    }
  }

  var cb = args[args.length - 1]
  return typeof cb === 'function' ? [options, cb] : [options]
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

  args = normalizeConnectArgs(args)
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
