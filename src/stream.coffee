
{EventEmitter} = require 'events'

class exports.Stream extends EventEmitter
  constructor: (client, seq)->
    super
    @_client = client
    @_seq = seq

  stop: (cb = ->) ->
    @_client.stop {Stop: @_seq}, cb
    process.nextTick =>
      @emit 'stop'
