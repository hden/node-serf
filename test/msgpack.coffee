'use strict'

msgpack  = require 'msgpack-js-v5-ng'

{Decode} = require '../msgpack'
{assert} = require 'chai'

describe 'streaming msgpack', ->
  dec = new Decode()

  it 'should decode', (done) ->
    a = {
      "Members": [
        {
          "Name": "TestNode",
          "Addr": [
            127,
            0,
            0,
            1
          ],
          "Port": 5000,
          "Tags": {
            "role": "test"
          },
          "Status": "alive",
          "ProtocolMin": 0,
          "ProtocolMax": 3,
          "ProtocolCur": 2,
          "DelegateMin": 0,
          "DelegateMax": 1,
          "DelegateCur": 1
        }
      ]
    }

    dec.on 'data', (b) ->
      assert.deepEqual a, b
      do done
    dec.on 'error', done
    dec.write msgpack.encode a
