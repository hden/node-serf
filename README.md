node-serf
=========

[![Build Status](https://travis-ci.org/hden/node-serf.svg?branch=master)](https://travis-ci.org/hden/node-serf)

[Serf](http://www.serfdom.io) management and orchestration client.

## Aim

To provide a interface for communication with Serf daemon via the [RPC Protocol](http://www.serfdom.io/docs/agent/rpc.html).

## Installation

```
npm install --save node-serf
```

## Quick Start

Just send the body. The header and `Seq` values have been taken care for you.
Commands without response bodies will invoke the callback upon acknowledgement
by the Serf agent. Commands with response bodies will invoke the callback with
the response.

```js
var Serf = require('node-serf');

// Connection to Serf agent at the default, "127.0.0.1:7373"
var client = Serf.connect(function (err) {
  assert.ifError(err);
  console.log('connected');

  client.join({Existing: ['127.0.0.1:7946'], Replay: false}, function (err, response) {
    assert.ifError(err);

    setTimeout(function() {
      client.leave();
    }, 1000);

  });
});
```

## API Documentation

Please refer to the [Serf RPC documentation](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown)
for authoritative information on each command.

#### Serf.connect([options][, callback])
* `options` \<Object\> Connection options. If omitted, defaults to
localhost:7373.
* `callback` \<Function\> Invoked after connected and handshake completed.

Returns a new Serf client.

The `options` argument typically contains `port` (required) and `host`
(defaults to `'localhost'`), but any of the [socket.connect options](https://nodejs.org/dist/latest-v6.x/docs/api/net.html#net_socket_connect_options_connectlistener)
are allowed.

#### serf.handshake([callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#handshake)
This is called automatically upon connecting. You should not call this
directly.

#### serf.auth(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#auth)

#### serf.end()
Disconnects from the Serf agent. You must call this to close the socket so that
node.js may gracefully exit. Alternatively, call `serf.leave()` to close both
the socket and the Serf agent; once called, you must restart the agent to
rejoin, however.

#### serf.leave([callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#leave)

#### serf.forceLeave(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#force-leave)

#### serf.event(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#event)

#### serf.join(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#join)

#### serf.members(callback) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#members)

#### serf.membersFiltered(filter, callback) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#members-filtered)

#### serf.tags(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#tags)

#### serf.stream(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#stream)

Listen via `on('data')` and `on('error')` listeners:

```js
var handler = client.stream({Type: '*'}); // returns instance of stream handler

handler.on('data', function (result) {
  // handle streaming message
  console.log(result);
  handler.stop(); // stop streaming
});

handler.on('error', console.error.bind(console)); // log errors
```

or, via a callback that will be invoked on every event instance:

```js
var handler = client.stream({Type: '*'}, function (err, result) {
  assert.ifError(err);
  console.log(result);
  handler.stop();
});
```

#### serf.monitor(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#monitor)

Listen using the same syntax as `serf.stream`.

#### serf.query(body, callback) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#query)
Issues a new query. The callback is invoked for every response. Check the
`Type` of the response, which may be 'ack', 'response' or 'done'.

#### serf.respond(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#respond)
* `body` \<Object\> Of the form `{ID: number, Payload: string|bytes[, ...]}`

Use with `serf.stream`. Your response `ID` property must match the query ID.

#### serf.installKey(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#install-key)

#### serf.useKey(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#use-key)

#### serf.removeKey(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#remove-key)

#### serf.listKeys(callback) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#list-keys)

#### serf.stats(callback) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#stats)

#### serf.getCoordinate(callback) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#get-coordinate)

#### Event: 'error'

The Serf client extends node.js's socket class. In addition to handling errors
passed to the command callbacks and errors raised on streams created by the
`monitor`, `stream` and `query` commands, you should subscribe to the client's
`'error'` event, which will be invoked in case of a socket error unrelated to a
Serf command (such as a network fault). If you do not, these errors will bubble
up and become uncaught exceptions.

```js
var client = Serf.connect({port: 7373}, function (err) {
  assert.ifError(err);
  /// do stuff
});

client.on('error', function (err) {
  // handle error
})
```

## Notes

* Serf RPC Protocol docs: https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown
