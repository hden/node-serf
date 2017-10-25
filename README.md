node-serf
=========

[![CircleCI](https://circleci.com/gh/hden/node-serf.svg?style=svg)](https://circleci.com/gh/hden/node-serf)
[![dependencies Status](https://david-dm.org/hden/node-serf/status.svg)](https://david-dm.org/hden/node-serf)

[Serf](http://www.serfdom.io) management and orchestration client.

## Aim

To provide a interface for communication with Serf daemon via the [RPC Protocol](http://www.serfdom.io/docs/agent/rpc.html).

## Installation

```
npm install --save node-serf
```

## Quick Start

Just send the body. The header and `Seq` values have been taken care of for you.
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

Returns an event emitter that can be handled with `'listen'`, `'data'`,
`'error'`  and `'stop'` listeners. This is *not* a node.js Stream, so it cannot
be piped, paused, etc. Messages are not buffered, so messages will be dropped
if listeners are not attached.

If a callback is provided, it will be added to the `'listen'` listeners.

The returned emitter has a `stop` method that ends the stream. If a callback is
provided, it will be added to the `'stop'` listeners.

```js
var stream = client.stream({Type: '*'}, function (err) {
  // Called after the stream is connected
  assert.ifError(err);
});

stream.on('listen', function (err) {
  // Also called after the stream is connected
});

stream.on('error', console.error.bind(console)); // log errors

stream.on('data', function (result) {
  // Handle streaming message
  console.log(result);

  // Stop streaming
  stream.stop(function (err) {
    // Called when the stream is stopped
  });
});

stream.on('stop', function () {
  // Also emitted when the stream is stopped
});
```

#### serf.monitor(body[, callback]) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#monitor)

Listen using the same syntax as `serf.stream`.

#### serf.query(body, callback) [(ref)](https://github.com/hashicorp/serf/blob/master/website/source/docs/agent/rpc.html.markdown#query)
Issues a new query. Listen using the same syntax as `serf.stream`. There are
three `Type`s of responses: 'ack', 'response' and 'done'. The 'data' event is
invoked when any type of response is received. When the 'done' response is
received, the 'stop' event will also be emitted.

Note that there appears to be a bug in Serf wherein responses are sometimes
sent with the form `{From: '', Payload: null, Type: 'response'}`. You should
check that `Payload` is not null before attempting to access it.

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
