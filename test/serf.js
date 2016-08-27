'use strict'

var assert = require('chai').assert
var spawn = require('child_process').spawn
var Serf = require('../serf')

describe('basic test', function () {
  var procs = []
  var clients = {}

  before(function (done) {
    procs.push(spawn('serf', ['agent', '-node=agent-one', '-bind=127.0.0.1:7946']))
    procs.push(spawn('serf', ['agent', '-node=agent-two', '-bind=127.0.0.1:7947', '-rpc-addr=127.0.0.1:7374']))

    setTimeout(function () {
      clients.one = Serf.connect({port: 7373}, function () {
        clients.two = Serf.connect({port: 7374}, done)
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

  it('should stats', function (done) {
    clients.one.stats({}, function (result) {
      assert.equal('agent-one', result.agent.name)
      done(result.Error === '' ? null : result.Error)
    })
  })

  it('should monitor', function (done) {
    var stream = clients.one.monitor({LogLevel: 'DEBUG'})
    stream.once('data', function (result) {
      assert.typeOf(result.Log, 'String')
      stream.stop()
      done()
    })
  })

  it('should join', function (done) {
    clients.one.join({Existing: ['127.0.0.1:7947'], Replay: false}, function (result) {
      done(result.Error === '' ? null : result.Error)
    })
  })

  it('should members', function (done) {
    clients.one.members(function (result) {
      assert.isArray(result.Members)
      assert.deepPropertyVal(result, 'Members.length', 2)
      done()
    })
  })

  it('should event', function (done) {
    clients.two.stream({Type: 'user:foo'}, function (data) {
      assert.equal('user', data.Event)
      assert.equal('foo', data.Name)
      assert.equal('test payload', data.Payload.toString())
      done()
    })
    clients.one.event({Name: 'foo', Payload: 'test payload', Coalesce: true})
  })

  it('should leave', function () {
    clients.one.leave()
  })
})
