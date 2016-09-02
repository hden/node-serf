## 1.0.0

*As version 1.0.0, this represents the first stable API. Semver will be
followed for all subsequent releases.*

#### Improvements

* **Breaking change** Use node.js-style error-first callbacks (#13, e3ed332)
* **Breaking change** Invoke callback to `stream`, `query` and `monitor` after
subscribing to the stream instead of on every data/error event. (4ca9ac7)
* Implement all Serf methods (#15, c51fab5)
* Add default connection syntax (#18, 160e461)

#### Bug fixes

* Invoke callbacks for commands without response bodies; fix listener leak
(c51fab5)
* Don't call the `connect` callback until after handshake completes (cca18c5)
* Don't call the `stream.stop` callback until after stream is stopped (4ca9ac7)

#### Other
* Port coffeescript to javascript
* Update msgpack dependency (5c0fc7d)
* Update other dependencies (89379b8)

## 0.1.3

#### Improvements

* Add camel-cased method aliases (29840bb)

## 0.1.2

#### Improvements

* Add `stats` command (00cb1c9)

## 0.1.1

#### Improvements:

* Support [tags](https://github.com/ryanuber/serf/blob/86e7f8bf41124405fd2608ec261148510e44e61e/client/rpc_client.go#L193-L202) command

## 0.1.0

#### Improvements:

* Customized streaming decoder

#### Bug fixes

* Properly decode messages
