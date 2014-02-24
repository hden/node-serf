'use strict'

Serf = require '../'

client = Serf.connect {port: 7373}, ->
  client.join {Existing: ['127.0.0.1:7947'], Replay: false}, ->
    client.leave()
