node-serf
=========

[Serf](http://www.serfdom.io) management and orchestration

## Aim

To provide a interface for communication with Serf daemon via the [RPC Protocol](http://www.serfdom.io/docs/agent/rpc.html).

## Usage

Just send the body. The header and `Seq` values has been taken cared for you.

```
var Serf = require('node-serf');

// The address that Serf will bind to for the agent's RPC server. By default this is "127.0.0.1:7373"
var client = Serf.connect({port: 7373}, function() {
  console.log('connected');
  client.join({Existing: ['127.0.0.1:7946'], Replay: false});


  fn = function() {
    client.leave();
  }

  setInterval(fn, 1000);
});
```

## Note

* Unlike node.js, serf agent emits empty string as success e.g. `{ Error: '', Seq: 1 }`
* [msgpack-node](https://www.npmjs.org/package/msgpack) is currently half-broken, and can only decode part of the message

## What works?

* join `client.join({Existing: ['127.0.0.1:7947'], Replay: false});`
* leave `client.leave()`

## What doesn't?

* member
* stream
* monitor

## Known issue

* The [msgpack](https://npmjs.org/package/msgpack) module hangs on custom events with payload. This is being investigated. Any suggestion?
