'use strict'

{assert} = require 'chai'
{spawn} = require 'child_process'
Serf = require '../'

describe 'basic test', ->
  procs = []
  client = undefined

  before (done) ->
    procs.push(spawn 'serf', ['agent', '-node=agent-one', '-bind=127.0.0.1:7946'])
    procs.push(spawn 'serf', ['agent', '-node=agent-two', '-bind=127.0.0.1:7947', '-rpc-addr=127.0.0.1:7374'])

    setTimeout ->
      client = Serf.connect {port: 7373}, done
    , 500

  after () ->
    procs.forEach (proc) ->
      do proc.kill

  it 'should stats', (done) ->
    client.stats {}, (result) ->
      assert.equal 'agent-one', result.agent.name
      done if result.Error is '' then undefined else result.Error

  it 'should join', (done) ->
    client.join {Existing: ['127.0.0.1:7947'], Replay: false}, (result) ->
      done if result.Error is '' then undefined else result.Error

  it 'should members', (done) ->
    client.members (result) ->
      assert.isArray result.Members
      assert.deepPropertyVal result, 'Members.length', 2
      do done

  it 'should leave', ->
    client.leave()
