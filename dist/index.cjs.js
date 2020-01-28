'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Emitter = _interopDefault(require('event-emitter'));
var allOff = _interopDefault(require('event-emitter/all-off'));
var nanoid = _interopDefault(require('nanoid'));
var detectBrowser = require('detect-browser');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var PeerConnector =
/*#__PURE__*/
function () {
  /**
   * @param {object} [props]
   * @param {MediaStream} [props.stream]
   * @param {RTCConfiguration} [props.config]
   * @param {boolean} [props.channel]
   * @param {string} [props.channelName]
   * @param {RTCDataChannelInit} [props.channelConfig]
   */
  function PeerConnector() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$stream = _ref.stream,
        stream = _ref$stream === void 0 ? false : _ref$stream,
        config = _ref.config,
        _ref$channel = _ref.channel,
        channel = _ref$channel === void 0 ? true : _ref$channel,
        _ref$channelName = _ref.channelName,
        channelName = _ref$channelName === void 0 ? nanoid(20) : _ref$channelName,
        _ref$channelConfig = _ref.channelConfig,
        channelConfig = _ref$channelConfig === void 0 ? {} : _ref$channelConfig;

    _classCallCheck(this, PeerConnector);

    this.stream = stream;
    this.peers = new Map();
    this.config = config;
    this.channel = channel;
    this.channelName = channelName;
    this.channelConfig = channelConfig;
    this._emitter = new Emitter();
  }

  _createClass(PeerConnector, [{
    key: "on",
    value: function on(eventName, listener) {
      this._emitter.on(eventName, listener);
    }
  }, {
    key: "once",
    value: function once(eventName, listener) {
      this._emitter.once(eventName, listener);
    }
  }, {
    key: "off",
    value: function off(eventName, listener) {
      this._emitter.off(eventName, listener);
    }
  }, {
    key: "addPeer",
    value: function addPeer(peer) {
      var _this = this;

      peer.once('connect', function () {
        return _this._emitter.emit('connect', peer);
      });
      this.peers.set(peer.id, peer);
      return peer;
    }
  }, {
    key: "removePeer",
    value: function removePeer(id) {
      return this.peers.delete(id);
    }
  }, {
    key: "hasPeer",
    value: function hasPeer(id) {
      return this.peers.has(id);
    }
  }, {
    key: "getPeer",
    value: function getPeer(id) {
      return this.peers.get(id);
    }
  }, {
    key: "close",
    value: function close() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.peers.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var peer = _step.value;
          peer.close();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.destroy();
    }
  }, {
    key: "destroy",
    value: function destroy() {
      allOff(this._emitter);
    }
  }]);

  return PeerConnector;
}();

var DEFAULT_CONFIG = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};

var Peer =
/*#__PURE__*/
function () {
  /**
   * @param {object} props
   * @param {string} [props.id]
   * @param {MediaStream} [props.stream]
   * @param {RTCConfiguration} [props.config]
   * @param {boolean} [props.channel]
   */
  function Peer() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$stream = _ref.stream,
        stream = _ref$stream === void 0 ? false : _ref$stream,
        _ref$id = _ref.id,
        id = _ref$id === void 0 ? nanoid(20) : _ref$id,
        _ref$channel = _ref.channel,
        channel = _ref$channel === void 0 ? true : _ref$channel,
        _ref$config = _ref.config,
        config = _ref$config === void 0 ? DEFAULT_CONFIG : _ref$config;

    _classCallCheck(this, Peer);

    this.id = id;
    this.localStream = stream;
    this.remoteStream = null;
    this.localSdp = null;
    this.remoteSdp = null;
    this._rtcPeer = new RTCPeerConnection(config);
    this._useDataChannel = channel;
    this._dataChannel = null;
    this._emitter = new Emitter();
    this._isConnectedPeer = false;
    this._isConnectedDataChannel = false;
    this._dataQueue = [];

    this._attachEvents();
  }

  _createClass(Peer, [{
    key: "on",
    value: function on(eventName, listener) {
      this._emitter.on(eventName, listener);
    }
  }, {
    key: "once",
    value: function once(eventName, listener) {
      this._emitter.once(eventName, listener);
    }
  }, {
    key: "off",
    value: function off(eventName, listener) {
      this._emitter.off(eventName, listener);
    }
  }, {
    key: "isConnected",
    value: function isConnected() {
      return this._useDataChannel ? this._isConnectedDataChannel && this._isConnectedPeer : this._isConnectedPeer;
    }
  }, {
    key: "getSenders",
    value: function getSenders() {
      return this._rtcPeer.getSenders();
    }
  }, {
    key: "createOfferSdp",
    value: function createOfferSdp(options) {
      return new Promise(function ($return, $error) {
        return Promise.resolve(this._rtcPeer.createOffer(options)).then(function ($await_3) {
          try {
            this.localSdp = $await_3;

            this._rtcPeer.setLocalDescription(this.localSdp);

            return $return(this.localSdp);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  }, {
    key: "createAnswerSdp",
    value: function createAnswerSdp(options) {
      return new Promise(function ($return, $error) {
        return Promise.resolve(this._rtcPeer.createAnswer(options)).then(function ($await_4) {
          try {
            this.localSdp = $await_4;

            this._rtcPeer.setLocalDescription(this.localSdp);

            return $return(this.localSdp);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  }, {
    key: "createDataChannel",
    value: function createDataChannel(channelName, dataChannelDict) {
      if (!this._useDataChannel) return;
      if (!this._rtcPeer.createDataChannel) return;

      this._setDataChannel(this._rtcPeer.createDataChannel(channelName, dataChannelDict));
    }
  }, {
    key: "setRemoteDescription",
    value: function setRemoteDescription(sdp) {
      this.remoteSdp = sdp;
      return this._rtcPeer.setRemoteDescription(new RTCSessionDescription(this.remoteSdp));
    }
  }, {
    key: "addIceCandidate",
    value: function addIceCandidate(candidate) {
      return this._rtcPeer.addIceCandidate(candidate);
    }
  }, {
    key: "send",
    value: function send(data) {
      if (!this._useDataChannel || !this._dataChannel) return;
      if (!this._rtcPeer.iceConnectionState === 'disconnected') return;

      this._dataChannel.send(data);
    }
  }, {
    key: "close",
    value: function close() {
      this.closePeer();
      this.closeChannel();
      this.destroy();
    }
  }, {
    key: "closePeer",
    value: function closePeer() {
      if (!this._rtcPeer.iceConnectionState === 'disconnected') return;

      this._rtcPeer.close();
    }
  }, {
    key: "closeChannel",
    value: function closeChannel() {
      if (!this._dataChannel) return;
      if (this._dataChannel.readyState === 'closed') return;

      this._dataChannel.close();
    }
  }, {
    key: "destroy",
    value: function destroy() {
      allOff(this._emitter);
    }
  }, {
    key: "_setDataChannel",
    value: function _setDataChannel(dataChannel) {
      var _this = this;

      this._dataChannel = dataChannel;

      this._dataChannel.onopen = function () {
        _this._isConnectedDataChannel = true;

        _this._emitConnect();
      };

      this._dataChannel.onmessage = function (_ref2) {
        var data = _ref2.data;

        if (!_this.isConnected()) {
          _this._dataQueue.push(data);

          return;
        }

        _this._emitter.emit('data', data);
      };

      this._dataChannel.onerror = function (error) {
        if (!_this._emitter.hasListeners(_this._emitter, 'error')) throw error;

        _this._emitter.emit('error', error);
      };

      this._dataChannel.onclose = function () {
        return _this._emitter.emit('close', 'datachannel');
      };
    }
  }, {
    key: "_attachEvents",
    value: function _attachEvents() {
      var _this2 = this;

      if (this.localStream) {
        this.localStream.getTracks().forEach(function (track) {
          _this2._rtcPeer.addTrack(track, _this2.localStream);
        });
      }

      this._rtcPeer.onicecandidate = function (_ref3) {
        var candidate = _ref3.candidate;
        if (candidate) _this2._emitter.emit('iceCandidate', candidate);
      };

      this._rtcPeer.ontrack = function (_ref4) {
        var streams = _ref4.streams;
        if (_this2.remoteStream) return;

        var _streams = _slicedToArray(streams, 1),
            stream = _streams[0];

        _this2._emitter.emit('stream', _this2.remoteStream = stream);
      };

      this._rtcPeer.ondatachannel = function (_ref5) {
        var channel = _ref5.channel;
        return _this2._setDataChannel(channel);
      };

      this._rtcPeer.oniceconnectionstatechange = function () {
        var state = _this2._rtcPeer.iceConnectionState;

        if (state === 'connected') {
          _this2._isConnectedPeer = true;

          _this2._emitConnect();
        }

        if (state === 'disconnected') {
          _this2._emitter.emit('close', 'ICE Connection');
        }

        _this2._emitter.emit('changeIceState', state);
      };
    }
  }, {
    key: "_emitConnect",
    value: function _emitConnect() {
      if (!this.isConnected()) return;

      this._emitter.emit('connect');

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this._dataQueue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var data = _step.value;

          this._emitter.emit('data', data);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this._dataQueue = [];
    }
  }]);

  return Peer;
}();

var SIGNAL_EVENT = {
  JOIN: 'join',
  REQUEST_CONNECT: 'requestConnect',
  SDP: 'sdp',
  CANDIDATE: 'candidate'
};

var Signal =
/*#__PURE__*/
function () {
  /**
   * @param {object} props
   * @param {WebSocket} props.websocket
   * @param {string} [props.id]
   */
  function Signal(_ref) {
    var websocket = _ref.websocket,
        _ref$id = _ref.id,
        id = _ref$id === void 0 ? nanoid(20) : _ref$id;

    _classCallCheck(this, Signal);

    this.id = id;
    this._emitter = new Emitter();
    this._ws = websocket;
    websocket.onmessage = this._onMessage.bind(this);
  }

  _createClass(Signal, [{
    key: "on",
    value: function on(eventName, listener) {
      this._emitter.on(eventName, listener);
    }
  }, {
    key: "once",
    value: function once(eventName, listener) {
      this._emitter.once(eventName, listener);
    }
  }, {
    key: "off",
    value: function off(eventName, listener) {
      this._emitter.off(eventName, listener);
    }
  }, {
    key: "send",
    value: function send(event) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this._ws.send(JSON.stringify({
        event: event,
        data: Object.assign({
          sender: this.id
        }, data)
      }));
    }
    /** @param {import('./PeerConnector').default} peerConnector */

  }, {
    key: "autoSignal",
    value: function autoSignal(peerConnector) {
      var _this = this;

      this.send(SIGNAL_EVENT.JOIN);

      this._emitter.on(SIGNAL_EVENT.JOIN, function (_ref2) {
        var sender = _ref2.sender;

        _this.send(SIGNAL_EVENT.REQUEST_CONNECT, {
          receiver: sender
        });
      });

      this._emitter.on(SIGNAL_EVENT.REQUEST_CONNECT, function (_ref3) {
        return new Promise(function ($return, $error) {
          var sender, stream, config, channel, channelName, channelConfig, peer;
          sender = _ref3.sender;
          stream = peerConnector.stream, config = peerConnector.config, channel = peerConnector.channel, channelName = peerConnector.channelName, channelConfig = peerConnector.channelConfig;
          peer = new Peer({
            id: sender,
            stream: stream,
            config: config,
            channel: channel
          });
          peerConnector.addPeer(peer);
          peer.createDataChannel(channelName, channelConfig);
          peer.on('iceCandidate', function (candidate) {
            _this.send(SIGNAL_EVENT.CANDIDATE, {
              receiver: peer.id,
              candidate: candidate
            });
          });
          return Promise.resolve(peer.createOfferSdp()).then(function ($await_2) {
            try {
              _this.send(SIGNAL_EVENT.SDP, {
                receiver: peer.id,
                sdp: $await_2
              });

              return $return();
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        });
      });

      this._emitter.on(SIGNAL_EVENT.SDP, function (_ref4) {
        return new Promise(function ($return, $error) {
          var sender, sdp, peer, stream, config, channel, _peer;

          sender = _ref4.sender, sdp = _ref4.sdp;

          if (sdp.type === 'answer') {
            peer = peerConnector.getPeer(sender);
            return Promise.resolve(peer.setRemoteDescription(sdp)).then(function ($await_3) {
              try {
                return $If_1.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          } else {
            stream = peerConnector.stream, config = peerConnector.config, channel = peerConnector.channel;
            _peer = new Peer({
              id: sender,
              stream: stream,
              config: config,
              channel: channel
            });
            peerConnector.addPeer(_peer);

            _peer.on('iceCandidate', function (candidate) {
              _this.send(SIGNAL_EVENT.CANDIDATE, {
                receiver: _peer.id,
                candidate: candidate
              });
            });

            return Promise.resolve(_peer.setRemoteDescription(sdp)).then(function ($await_4) {
              try {
                return Promise.resolve(_peer.createAnswerSdp()).then(function ($await_5) {
                  try {
                    _this.send(SIGNAL_EVENT.SDP, {
                      receiver: _peer.id,
                      sdp: $await_5
                    });

                    return $If_1.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_1() {
            return $return();
          }
        });
      });

      this._emitter.on(SIGNAL_EVENT.CANDIDATE, function (_ref5) {
        var sender = _ref5.sender,
            candidate = _ref5.candidate;
        var peer = peerConnector.getPeer(sender);
        peer.addIceCandidate(candidate);
      });
    }
  }, {
    key: "destroy",
    value: function destroy() {
      allOff(this._emitter);
    }
  }, {
    key: "_onMessage",
    value: function _onMessage() {
      var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          message = _ref6.data;

      var _JSON$parse = JSON.parse(message),
          event = _JSON$parse.event,
          data = _JSON$parse.data;

      if (!this._equalId(data)) return;

      this._emitter.emit(event, data);

      this._emitter.emit('message', {
        event: event,
        data: data
      });
    }
  }, {
    key: "_equalId",
    value: function _equalId(data) {
      return !data.receiver || data.receiver === this.id;
    }
  }]);

  return Signal;
}();

var EXTENSION_ID = 'mopiaiibclcaiolndiidmkpejmcpjmcf';
var EXTENSION_URL = "https://chrome.google.com/webstore/detail/screen-sharing-extension/".concat(EXTENSION_ID);
function requestScreen() {
  return new Promise(function ($return, $error) {
    switch (detectBrowser.detect().name) {
      case 'firefox':
        return $return({
          mediaSource: 'screen'
        });

      case 'chrome':
        return Promise.resolve(isInstalledExtension()).then(function ($await_2) {
          try {
            if (!$await_2) {
              window.location.href = EXTENSION_URL;
            }

            return Promise.resolve(getStreamId()).then(function ($await_3) {
              try {
                return $return({
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: $await_3,
                    maxWidth: window.screen.width,
                    maxHeight: window.screen.height
                  }
                });
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }, $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);

      default:
        return $error(new Error('not support browser'));
    }

    return $return();
  });
}

function getStreamId() {
  return new Promise(function (resolve) {
    window.postMessage({
      type: 'SCREEN_REQUEST',
      text: 'start'
    }, '*');
    window.addEventListener('message', function listener(_ref) {
      var _ref$data = _ref.data,
          type = _ref$data.type,
          streamId = _ref$data.streamId;

      if (type === 'SCREEN_SHARE') {
        window.removeEventListener('message', listener);
        resolve(streamId);
      }

      if (type === 'SCREEN_CANCEL') {
        window.removeEventListener('message', listener);
        resolve(false);
      }
    });
  });
}

function isInstalledExtension() {
  return new Promise(function (resolve) {
    var img = document.createElement('img');
    img.src = "chrome-extension://".concat(EXTENSION_ID, "/icon.png");

    img.onload = function () {
      return resolve(true);
    };

    img.onerror = function () {
      return resolve(false);
    };
  });
}

/**
 * @param {{ screen: boolean } & MediaStreamConstraints} args
 * @return {Promise<MediaStream>}
*/

function getMediaStream() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      screen = _ref.screen,
      video = _ref.video,
      audio = _ref.audio;

  return screen ? getDisplayMedia() : navigator.mediaDevices.getUserMedia({
    video: video,
    audio: audio
  });
}

function getDisplayMedia() {
  if (navigator.getDisplayMedia) {
    return navigator.getDisplayMedia({
      video: true
    });
  }

  if (navigator.mediaDevices.getDisplayMedia) {
    return navigator.mediaDevices.getDisplayMedia({
      video: true
    });
  }

  return navigator.mediaDevices.getUserMedia({
    video: requestScreen()
  });
}

/**
 * @param {string} url
 * @param {string | string[]} protocols
 */
function connectWebsocket(url, protocols) {
  return new Promise(function (resolve, reject) {
    var webSocket = new WebSocket(url, protocols);

    webSocket.onopen = function () {
      return resolve(webSocket);
    };

    webSocket.onerror = function () {
      return reject(new Error('connect failed.'));
    };
  });
}

exports.default = PeerConnector;
exports.PeerConnector = PeerConnector;
exports.Peer = Peer;
exports.Signal = Signal;
exports.SIGNAL_EVENT = SIGNAL_EVENT;
exports.getMediaStream = getMediaStream;
exports.connectWebsocket = connectWebsocket;
