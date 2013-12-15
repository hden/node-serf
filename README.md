node-serf
=========

[Serf](http://www.serfdom.io) management and orchestration

## Aim

To provide a interface for communication with Serf daemon via the [RPC Protocol](http://www.serfdom.io/docs/agent/rpc.html).

## Usage

Just send the body. The header and `Seq` values has been taken cared for you.

```
var Serf, client;

Serf = require('node-serf');

// The address that Serf will bind to for the agent's RPC server. By default this is "127.0.0.1:7373"
client = Serf.connect({port: 7373}, function() {
  console.log('connected');
  client.members(function(data) {
    console.log(JSON.stringify(data, null, 4));
  });
});
```

## Known issue

* The [msgpack](https://npmjs.org/package/msgpack) module hangs on custom events with payload. This is being investigated. Any suggestion?
