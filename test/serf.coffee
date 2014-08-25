'use strict'

{assert} = require 'chai'
{spawn} = require 'child_process'
Serf = require '../'

describe 'basic test', ->
  procs = []
  clients = {}

  before (done) ->
    procs.push(spawn 'serf', ['agent', '-node=agent-one', '-bind=127.0.0.1:7946'])
    procs.push(spawn 'serf', ['agent', '-node=agent-two', '-bind=127.0.0.1:7947', '-rpc-addr=127.0.0.1:7374'])

    setTimeout ->
      clients.one = Serf.connect {port: 7373}, ->
        clients.two = Serf.connect {port: 7374}, done
    , 500

  after () ->
    procs.forEach (proc) ->
      do proc.kill

  it 'should define camel-casing methods', ->
    assert.equal clients.one['force-leave'], clients.one.forceLeave

  it 'should stats', (done) ->
    clients.one.stats {}, (result) ->
      assert.equal 'agent-one', result.agent.name
      done if result.Error is '' then undefined else result.Error

  it 'should monitor', (done) ->
    stream = clients.one.monitor {LogLevel: 'DEBUG'}
    stream.once 'data', (result) ->
      assert.typeOf result.Log, 'String'
      do stream.stop
      do done

  it 'should join', (done) ->
    clients.one.join {Existing: ['127.0.0.1:7947'], Replay: false}, (result) ->
      done if result.Error is '' then undefined else result.Error

  it 'should members', (done) ->
    clients.one.members (result) ->
      assert.isArray result.Members
      assert.deepPropertyVal result, 'Members.length', 2
      do done

  it 'should event', (done) ->
    clients.two.stream {Type: 'user:foo'}, (data) ->
      assert.equal 'user', data.Event
      assert.equal 'foo', data.Name
      assert.equal 'test payload', data.Payload.toString()
      do done
    clients.one.event {Name: 'foo', Payload: 'test payload', Coalesce: true}

  it 'should leave', ->
    do clients.one.leave
