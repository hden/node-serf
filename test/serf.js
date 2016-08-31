'use strict'

var assert = require('chai').assert
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
    assert.equal(clients.one['force-leave'], clients.one.forceLeave)
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

  describe('stats', function () {
    it('works', function (done) {
      clients.one.stats({}, function (err, result) {
        assert.ifError(err)
        assert.equal('agent-one', result.agent.name)
        done(result.Error === '' ? null : result.Error)
      })
    })
  })

  describe('monitor', function () {
    it('works', function (done) {
      var stream = clients.one.monitor({LogLevel: 'DEBUG'})
      stream.once('data', function (result) {
        assert.typeOf(result.Log, 'String')
        stream.stop()
        done()
      })
      stream.on('error', function (err) {
        assert.ifError(err)
      })
    })
  })

  describe('join', function () {
    it('works', function (done) {
      clients.one.join({Existing: ['127.0.0.1:7947'], Replay: false}, function (err, result) {
        assert.ifError(err)
        assert.equal(result.Num, 1)
        done(result.Error === '' ? null : result.Error)
      })
    })
  })

  describe('members', function () {
    it('works', function (done) {
      clients.one.members(function (err, result) {
        assert.ifError(err)
        assert.isArray(result.Members)
        assert.deepPropertyVal(result, 'Members.length', 2)
        done()
      })
    })
  })

  describe('stream+event', function () {
    it('works', function (done) {
      clients.two.stream({Type: 'user:foo'}, function (err, data) {
        assert.ifError(err)
        assert.equal('user', data.Event)
        assert.equal('foo', data.Name)
        assert.equal('test payload', data.Payload.toString())
        done()
      })
      clients.one.event({Name: 'foo', Payload: 'test payload', Coalesce: true})
    })
  })

  describe('force-leave', function () {})

  describe('auth', function () {})

  describe('tags', function () {
    it('works', function (done) {
      clients.one.tags({Tags: {key1: 'val1'}}, function (err) {
        assert.ifError(err)
        done()
      })
    })
  })

  describe('members-filtered', function () {
    it('works', function (done) {
      clients.one.membersFiltered({Tags: {key1: 'val1'}}, function (err, res) {
        assert.ifError(err)
        assert.equal(res.Members.length, 1)
        assert.equal(res.Members[0].Name, 'agent-one')
        done()
      })
    })
  })

  describe('query+stream+respond', function () {
    it('works', function (done) {
      clients.two.stream({Type: 'query'}, function (err, data) {
        assert.ifError(err)
        assert.equal(data.Event, 'query')
        assert.equal(data.Name, 'name')
        assert.equal(data.Payload.toString(), 'payload')
        assert.isNumber(data.ID)
        var ID = data.ID
        clients.two.respond({ID: ID, Payload: 'client two response'})
      })
      var opts = {Name: "name", Payload: "payload", Timeout: 1000000}
      clients.one.query(opts, function (err, data) {
        assert.ifError(err)
        if (data.Type === 'response') {
          assert.equal(data.Payload.toString(), 'client two response')
        } else if (data.Type === 'done') {
          done()
        }
      })
    })
  })

  describe('install-key', function () {})

  describe('use-key', function () {})

  describe('remove-key', function () {})

  describe('list-keys', function () {})

  describe('get-coordinate', function () {
    it('works', function (done) {
      clients.one.getCoordinate({Node: 'agent-one'}, function (err, res) {
        assert.ifError(err)
        assert(res.Ok)
        assert.property(res, "Coord")
        done()
      })
    })
  })

  describe('leave', function () {
    it('works', function (done) {
      clients.two.stream({Type: 'member-leave'}, function (err, data) {
        assert.ifError(err)
        assert.equal(data.Members[0].Name, 'agent-one')
        done()
      })
      setTimeout(function () {
        clients.one.leave(function (err) {
          assert.ifError(err)
        })
      }, 250)
    })
  })
})
