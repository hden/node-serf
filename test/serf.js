/* global describe before after it */
'use strict'

var assert = require('power-assert')
var spawn = require('child_process').spawn
var net = require('net')
var Serf = require('../serf')

describe('Serf', function () {
  var procs = []
  var clients = {}

  before(function (done) {
    procs.push(spawn('serf', ['agent', '-node=agent-one', '-bind=127.0.0.1:7946', '-rpc-addr=127.0.0.1:7374']))
    procs.push(spawn('serf', ['agent', '-node=agent-two', '-bind=127.0.0.1:7947', '-rpc-addr=127.0.0.1:7375']))

    setTimeout(function () {
      clients.one = Serf.connect({port: 7374}, function (err) {
        assert.ifError(err)
        clients.two = Serf.connect({port: 7375}, done)
      })
    }, 500)
  })

  after(function () {
    procs.forEach(function (proc) {
      proc.kill()
    })
  })

  it('should define camel-casing methods', function () {
    assert(clients.one['force-leave'] === clients.one.forceLeave)
  })

  describe('connect', function () {
    it('defaults to localhost:7373', function (done) {
      var mockServer = net.createServer(function (c) {
        c.end()
        mockServer.close(done)
      })
      mockServer.listen(7373, function () { })

      var agent = Serf.connect(function () {
        agent.end()
      })
    })
  })

  it('stats', function (done) {
    clients.one.stats(function (err, result) {
      assert.ifError(err)
      assert(result.agent.name === 'agent-one')
      done(result.Error === '' ? null : result.Error)
    })
  })

  it('monitor', function (done) {
    var stream = clients.one.monitor({LogLevel: 'DEBUG'})
    stream.once('data', function (result) {
      assert(typeof result.Log === 'string')
      stream.stop(done)
    })
    stream.on('error', done)
  })

  it('join', function (done) {
    clients.one.join({Existing: ['127.0.0.1:7947'], Replay: false}, function (err, result) {
      assert.ifError(err)
      assert(result.Num === 1)
      done()
    })
  })

  it('members', function (done) {
    clients.one.members(function (err, result) {
      assert.ifError(err)
      assert(Array.isArray(result.Members))
      assert(result.Members.length === 2)
      done()
    })
  })

  it('members promise interface', function (done) {
    clients.one.members().then(function (result) {
      assert(Array.isArray(result.Members))
      assert(result.Members.length === 2)
      done()
    }).catch(function (err) {
      assert.ifError(err)
      done()
    })
  })

  it('stream works with a "listen" callback', function (done) {
    var stream = clients.two.stream({Type: 'user:foo'}, function (err) {
      assert.ifError(err)
      clients.one.event({Name: 'foo', Payload: 'test payload', Coalesce: true}, function (err) {
        assert.ifError(err)
      })
    })
    stream.on('error', done)
    stream.on('data', function (data) {
      assert(data.Event === 'user')
      assert(data.Name === 'foo')
      assert(data.Payload.toString() === 'test payload')
      stream.stop(done)
    })
  })

  it('stream works with a "listen" listener', function (done) {
    var stream = clients.two.stream({Type: 'user:foo'})
    stream.on('listen', function (err) {
      assert.ifError(err)
      clients.one.event({Name: 'foo', Payload: 'test payload', Coalesce: true}, function (err) {
        assert.ifError(err)
      })
    })
    stream.on('error', done)
    stream.on('data', function (data) {
      assert(data.Event === 'user')
      assert(data.Name === 'foo')
      assert(data.Payload.toString() === 'test payload')
      stream.stop(done)
    })
  })

  it('force-leave')

  it('auth')

  it('tags', function (done) {
    clients.one.tags({Tags: {key1: 'val1'}}, function (err) {
      assert.ifError(err)
      done()
    })
  })

  it('membersFiltered', function (done) {
    clients.one.membersFiltered({Tags: {key1: 'val1'}}, function (err, res) {
      assert.ifError(err)
      assert(res.Members.length === 1)
      assert(res.Members[0].Name === 'agent-one')
      done()
    })
  })

  it('query+stream+respond', function (done) {
    var queryStream = clients.two.stream({Type: 'query'}, function (err) {
      assert.ifError(err)
      var opts = {Name: 'name', Payload: 'payload'}
      var responseStream = clients.one.query(opts, function (err) {
        assert.ifError(err)
      })
      responseStream.on('data', function (data) {
        if (data.Type === 'response' && data.Payload) {
          assert(data.Payload.toString() === 'client two response')
        }
      })
      responseStream.on('stop', function () {
        queryStream.stop(done)
      })
    })

    queryStream.on('data', function (data) {
      assert(data.Event === 'query')
      assert(data.Name === 'name')
      assert(data.Payload.toString() === 'payload')
      assert(typeof data.ID === 'number')
      var ID = data.ID
      clients.two.respond({ID: ID, Payload: 'client two response'}, function (err) {
        assert.ifError(err)
      })
    })
  })

  it('install-key')

  it('use-key')

  it('remove-key')

  it('list-keys')

  it('get-coordinate', function (done) {
    clients.one.getCoordinate({Node: 'agent-one'}, function (err, res) {
      assert.ifError(err)
      assert(res.Ok)
      assert(res.Coord)
      done()
    })
  })

  it('leave', function (done) {
    var stream = clients.two.stream({Type: 'member-leave'}, function (err) {
      assert.ifError(err)
      clients.one.leave(function (err) {
        assert.ifError(err)
      })
    })
    stream.on('data', function (data) {
      assert(data.Members[0].Name === 'agent-one')
      done()
    })
  })
})
