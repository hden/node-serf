'use strict'

var msgpack  = require('msgpack-js-v5-ng')

var Decode = require('../msgpack').Decode
var assert = require('chai').assert

describe('streaming msgpack', function () {
  var dec = new Decode()

  it('should decode', function (done) {
    var a = {
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

    dec.on('data', function (b) {
      assert.deepEqual(a, b)
      done()
    })
    dec.on('error', done)
    dec.write(msgpack.encode(a))
  })
})
