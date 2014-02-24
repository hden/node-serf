'use strict'

{assert} = require 'chai'
Serf = require '../'

###
Please start two serf agents by

```
$ serf agent -node=agent-one -bind=127.0.0.1:7946
$ serf agent -node=agent-two -bind=127.0.0.1:7947 -rpc-addr=127.0.0.1:7374
```
###

describe 'basic test', ->
  client = undefined

  before (done) ->
    client = Serf.connect {port: 7373}, done

  it 'should join', (done) ->
    client.join {Existing: ['127.0.0.1:7947'], Replay: false}, (result) ->
      done if result.Error is '' then undefined else result.Error

  it 'should leave', ->
    client.leave()
