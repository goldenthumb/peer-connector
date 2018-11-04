'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var detectBrowser = require('detect-browser');
var Emitter = _interopDefault(require('event-emitter'));
var randombytes = _interopDefault(require('randombytes'));
var getBrowserRTC = _interopDefault(require('get-browser-rtc'));

var connect = function connect(_ref) {
  var host = _ref.host,
      port = _ref.port,
      username = _ref.username,
      password = _ref.password,
      _ref$ssl = _ref.ssl,
      ssl = _ref$ssl === void 0 ? false : _ref$ssl;
  return new Promise(function (resolve, reject) {
    var accessAuth = username && password ? "".concat(username, ":").concat(password, "@") : '';
    var webSocket = new WebSocket("".concat(ssl ? 'wss' : 'ws', "://").concat(accessAuth).concat(host, ":").concat(port));

    webSocket.onopen = function () {
      return resolve(webSocket);
    };

    webSocket.onerror = function () {
      return reject(new Error('connect failed.'));
    };
  });
};

var connect$1 = (function (servers) {
  return new Promise(function ($return, $error) {
    var $Try_1_Finally = function ($Try_1_Exit) {
      return function ($Try_1_Value) {
        try {
          var $Try_3_Finally = function ($Try_3_Exit) {
            return function ($Try_3_Value) {
              try {
                if (_didIteratorError) {
                  throw _iteratorError;
                }

                return $Try_3_Exit && $Try_3_Exit.call(this, $Try_3_Value);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this);
          }.bind(this);

          var $Try_3_Catch = function ($exception_4) {
            try {
              throw $exception_4;
            } catch ($boundEx) {
              return $Try_3_Finally($error)($boundEx);
            }
          }.bind(this);

          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }

            return $Try_3_Finally().call(this);
          } catch ($exception_4) {
            $Try_3_Catch($exception_4);
          }

          return $Try_1_Exit && $Try_1_Exit.call(this, $Try_1_Value);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this);
    }.bind(this);

    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, server;

    _iteratorNormalCompletion = true;
    _didIteratorError = false;
    _iteratorError = undefined;

    var $Try_1_Post = function () {
      try {
        return $return();
      } catch ($boundEx) {
        return $error($boundEx);
      }
    };

    var $Try_1_Catch = function (err) {
      try {
        _didIteratorError = true;
        _iteratorError = err;
        return $Try_1_Finally($Try_1_Post)();
      } catch ($boundEx) {
        return $Try_1_Finally($error)($boundEx);
      }
    };

    try {
      _iterator = servers[Symbol.iterator]();
      var $Loop_5_trampoline;

      function $Loop_5_step() {
        _iteratorNormalCompletion = true;
        return $Loop_5;
      }

      function $Loop_5() {
        if (!(_iteratorNormalCompletion = (_step = _iterator.next()).done)) {
          server = _step.value;

          var $Try_2_Catch = function (error) {
            try {
              return $Loop_5_step;
            } catch ($boundEx) {
              return $Try_1_Catch($boundEx);
            }
          };

          try {
            return Promise.resolve(connect(server)).then($Try_1_Finally($return), $Try_2_Catch);
          } catch (error) {
            $Try_2_Catch(error);
          }
        } else return [1];
      }

      return ($Loop_5_trampoline = function (q) {
        while (q) {
          if (q.then) return void q.then($Loop_5_trampoline, $Try_1_Catch);

          try {
            if (q.pop) {
              if (q.length) return q.pop() ? $Loop_5_exit.call(this) : q;else q = $Loop_5_step;
            } else q = q.call(this);
          } catch (_exception) {
            return $Try_1_Catch(_exception);
          }
        }
      }.bind(this))($Loop_5);

      function $Loop_5_exit() {
        return $Try_1_Finally($Try_1_Post)();
      }
    } catch (err) {
      $Try_1_Catch(err);
    }
  });
});

var userAgent = detectBrowser.detect();
var EXTENSION_ID = 'mopiaiibclcaiolndiidmkpejmcpjmcf';
var EXTENSION_URL = "https://chrome.google.com/webstore/detail/screen-sharing-extension/".concat(EXTENSION_ID);
var requestScreen = (function () {
  return new Promise(function ($return, $error) {
    if (!isSupport()) {
      return $error(new Error('not support browser'));
    }

    if (userAgent.name === 'firefox') {
      return $return({
        mediaSource: 'screen'
      });
    }

    if (userAgent.name === 'chrome') {
      return Promise.resolve(getStreamId()).then(function ($await_2) {
        try {
          return $return({
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: $await_2,
              maxWidth: window.screen.width,
              maxHeight: window.screen.height
            }
          });
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    }

    return $return();
  });
});

var isSupport = function isSupport() {
  var browser = userAgent.name;
  return browser === 'chrome' || browser === 'firefox';
};

var getStreamId = function getStreamId() {
  return new Promise(function ($return, $error) {
    return Promise.resolve(isInstalledExtension()).then(function ($await_3) {
      try {
        if (!$await_3) {
          window.location.href = EXTENSION_URL;
        }

        window.postMessage({
          type: 'SCREEN_REQUEST',
          text: 'start'
        }, '*');
        return Promise.resolve(new Promise(function (resolve) {
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
        })).then($return, $error);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
};

var isInstalledExtension = function isInstalledExtension() {
  return new Promise(function ($return, $error) {
    var img;
    img = document.createElement('img');
    img.src = "chrome-extension://".concat(EXTENSION_ID, "/icon.png");
    return Promise.resolve(new Promise(function (resolve) {
      img.onload = function () {
        return resolve(true);
      };

      img.onerror = function () {
        return resolve(false);
      };
    })).then($return, $error);
  });
};

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

var MESSAGE = {
  JOIN: '/PEER_CONNECTOR/join',
  REQUEST_CONNECT: '/PEER_CONNECTOR/request/peer-connect',
  SDP: '/PEER_CONNECTOR/sdp',
  CANDIDATE: '/PEER_CONNECTOR/candidate'
};

var Signal =
/*#__PURE__*/
function () {
  function Signal(webSocket) {
    _classCallCheck(this, Signal);

    this._emitter = new Emitter();
    this._ws = webSocket;
    this._ws.onmessage = this._onMessage.bind(this);
    this._id = randombytes(20).toString('hex');

    this._onMessage();
  }

  _createClass(Signal, [{
    key: "on",
    value: function on(eventName, listener) {
      this._emitter.on(eventName, listener);
    }
  }, {
    key: "join",
    value: function join() {
      this._send(MESSAGE.JOIN, {
        sender: this._id
      });
    }
  }, {
    key: "requestPeer",
    value: function requestPeer(receiver) {
      this._send(MESSAGE.REQUEST_CONNECT, {
        receiver: receiver,
        sender: this._id
      });
    }
  }, {
    key: "sendSdp",
    value: function sendSdp(receiver, sdp) {
      this._send(MESSAGE.SDP, {
        receiver: receiver,
        sender: this._id,
        sdp: sdp
      });
    }
  }, {
    key: "sendCandidate",
    value: function sendCandidate(receiver, candidate) {
      this._send(MESSAGE.CANDIDATE, {
        receiver: receiver,
        sender: this._id,
        candidate: candidate
      });
    }
  }, {
    key: "_onMessage",
    value: function _onMessage(message) {
      if (!message) return;

      var _JSON$parse = JSON.parse(message.data),
          event = _JSON$parse.event,
          data = _JSON$parse.data;

      if (this._equalId(data)) this._emitter.emit(event, data);
    }
  }, {
    key: "_send",
    value: function _send(event, data) {
      this._ws.send(JSON.stringify({
        event: event,
        data: data
      }));
    }
  }, {
    key: "_equalId",
    value: function _equalId(data) {
      return !data.receiver || data.receiver === this._id;
    }
  }]);

  return Signal;
}();

var Peer =
/*#__PURE__*/
function () {
  function Peer(id) {
    _classCallCheck(this, Peer);

    this.id = id;
    this._dc = null;
    this._emitter = new Emitter();
    this.localSdp = null;
    this.remoteSdp = null;
    this.localStream = null;
    this.remoteStream = null;
  }

  _createClass(Peer, [{
    key: "on",
    value: function on(eventName, listener) {
      this._emitter.on(eventName, listener);
    }
  }, {
    key: "send",
    value: function send(data) {
      this._dc && this._dc.send(data);
    }
  }, {
    key: "_isConnected",
    value: function _isConnected() {
      return this.localSdp && this.remoteSdp && this.remoteStream;
    }
  }, {
    key: "_setLocalStream",
    value: function _setLocalStream(stream) {
      this.localStream = stream;
    }
  }, {
    key: "_setRemoteStream",
    value: function _setRemoteStream(stream) {
      this.remoteStream = stream;
    }
  }, {
    key: "_setDataChannel",
    value: function _setDataChannel(channel) {
      this._dc = channel;
    }
  }, {
    key: "_setLocalSdp",
    value: function _setLocalSdp(sdp) {
      this.localSdp = sdp;
    }
  }, {
    key: "_setRemoteSdp",
    value: function _setRemoteSdp(sdp) {
      this.remoteSdp = sdp;
    }
  }, {
    key: "_attachDataChannel",
    value: function _attachDataChannel() {
      var _this = this;

      this._dc.onmessage = function (_ref) {
        var data = _ref.data;
        return _this._emitter.emit('message', data);
      };

      this._dc.onclose = function () {
        return _this._emitter.emit('close');
      };

      this._dc.onopen = function () {
        return _this._emitter.emit('open');
      };

      this._dc.onerror = function (error) {
        if (!_this._emitter.hasListeners(_this._emitter, 'error')) throw error;

        _this._emitter.emit('error', error);
      };
    }
  }]);

  return Peer;
}();

var Connector =
/*#__PURE__*/
function () {
  function Connector(peer) {
    _classCallCheck(this, Connector);

    this._peer = peer;
    this.onIceCandidate = null;
    this.onAddStream = null;
    this.onDataChannel = null;
  }

  _createClass(Connector, [{
    key: "createOffer",
    value: function createOffer() {
      return this._peer.createOffer();
    }
  }, {
    key: "createAnswer",
    value: function createAnswer() {
      return this._peer.createAnswer();
    }
  }, {
    key: "createDataChannel",
    value: function createDataChannel(channelName) {
      return this._peer.createDataChannel(channelName);
    }
  }, {
    key: "addStream",
    value: function addStream(stream) {
      return this._peer.addStream(stream);
    }
  }, {
    key: "setLocalDescription",
    value: function setLocalDescription(sdp) {
      return this._peer.setLocalDescription(sdp);
    }
  }, {
    key: "setRemoteDescription",
    value: function setRemoteDescription(sdp) {
      return this._peer.setRemoteDescription(sdp);
    }
  }, {
    key: "addIceCandidate",
    value: function addIceCandidate(candidate) {
      return this._peer.addIceCandidate(candidate);
    }
  }, {
    key: "onIceCandidate",
    set: function set(func) {
      this._peer.onicecandidate = func;
    }
  }, {
    key: "onAddStream",
    set: function set(func) {
      this._peer.onaddstream = func;
    }
  }, {
    key: "onDataChannel",
    set: function set(func) {
      this._peer.ondatachannel = func;
    }
  }]);

  return Connector;
}();

var WebRTC =
/*#__PURE__*/
function () {
  function WebRTC(_ref) {
    var signal = _ref.signal,
        mediaType = _ref.mediaType,
        config = _ref.config;

    _classCallCheck(this, WebRTC);

    if (!WebRTC.support()) {
      throw new Error('Not support getUserMedia API');
    }

    this._emitter = new Emitter();
    this._channelName = randombytes(20).toString('hex');
    this._peers = new Map();
    this._connectors = new Map();
    this._stream = null;
    this._signal = signal;
    this._options = mediaType;
    this._config = config;
  }

  _createClass(WebRTC, [{
    key: "on",
    value: function on(eventName, listener) {
      this._emitter.on(eventName, listener);
    }
  }, {
    key: "_init",
    value: function _init() {
      return new Promise(function ($return, $error) {
        return Promise.resolve(navigator.mediaDevices.getUserMedia(this._options)).then(function ($await_2) {
          try {
            this._stream = $await_2;

            this._onMessage();

            return $return(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  }, {
    key: "_emitIfConnectedPeer",
    value: function _emitIfConnectedPeer(peer) {
      if (peer._isConnected()) {
        this._emitter.emit('connect', peer);
      }
    }
  }, {
    key: "_addPeer",
    value: function _addPeer(id) {
      var peer = new Peer(id);
      var connector = new Connector(new RTCPeerConnection(this._config));

      this._peers.set(id, peer);

      this._connectors.set(id, connector);

      return this._peers.get(id);
    }
  }, {
    key: "_onMessage",
    value: function _onMessage() {
      var _this = this;

      var signal = this._signal;
      signal.join();
      signal.on(MESSAGE.JOIN, function (_ref2) {
        var sender = _ref2.sender;
        signal.requestPeer(sender);
      });
      signal.on(MESSAGE.REQUEST_CONNECT, function (_ref3) {
        return new Promise(function ($return, $error) {
          var sender, peer, connector, channel;
          sender = _ref3.sender;
          peer = _this._addPeer(sender);
          connector = _this._connectors.get(sender);
          channel = connector.createDataChannel(_this._channelName);

          peer._setDataChannel(channel);

          peer._attachDataChannel();

          _this._attachEvents({
            peer: peer,
            connector: connector
          });

          return Promise.resolve(_this._createOffer({
            peer: peer,
            connector: connector
          })).then(function ($await_3) {
            try {
              _this._emitIfConnectedPeer(peer);

              signal.sendSdp(peer.id, peer.localSdp);
              return $return();
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        });
      });
      signal.on(MESSAGE.SDP, function (_ref4) {
        return new Promise(function ($return, $error) {
          var sender, sdp, peer, connector, _peer, _connector;

          sender = _ref4.sender, sdp = _ref4.sdp;

          if (sdp.type === 'offer') {
            peer = _this._addPeer(sender);
            connector = _this._connectors.get(sender);

            _this._attachEvents({
              peer: peer,
              connector: connector
            });

            connector.onDataChannel = function (_ref5) {
              var channel = _ref5.channel;

              peer._setDataChannel(channel);

              peer._attachDataChannel();
            };

            return Promise.resolve(connector.setRemoteDescription(sdp)).then(function ($await_4) {
              try {
                return Promise.resolve(_this._createAnswer({
                  peer: peer,
                  connector: connector
                })).then(function ($await_5) {
                  try {
                    peer._setRemoteSdp(sdp);

                    _this._emitIfConnectedPeer(peer);

                    signal.sendSdp(peer.id, peer.localSdp);
                    return $If_1.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          } else {
            _peer = _this._peers.get(sender);
            _connector = _this._connectors.get(sender);
            return Promise.resolve(_connector.setRemoteDescription(sdp)).then(function ($await_6) {
              try {
                _peer._setRemoteSdp(sdp);

                _this._emitIfConnectedPeer(_peer);

                return $If_1.call(this);
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
      signal.on(MESSAGE.CANDIDATE, function (_ref6) {
        var sender = _ref6.sender,
            candidate = _ref6.candidate;

        var connector = _this._connectors.get(sender);

        connector.addIceCandidate(candidate);
      });
    }
  }, {
    key: "_attachEvents",
    value: function _attachEvents(_ref7) {
      var _this2 = this;

      var peer = _ref7.peer,
          connector = _ref7.connector;

      peer._setLocalStream(this._stream);

      connector.addStream(this._stream);

      connector.onIceCandidate = function (_ref8) {
        var candidate = _ref8.candidate;
        if (!candidate) return;

        _this2._signal.sendCandidate(peer.id, candidate);
      };

      connector.onAddStream = function (_ref9) {
        var stream = _ref9.stream;

        peer._setRemoteStream(stream);

        _this2._emitIfConnectedPeer(peer);
      };
    }
  }, {
    key: "_createOffer",
    value: function _createOffer(_ref10) {
      return new Promise(function ($return, $error) {
        var peer, connector, sdp;
        peer = _ref10.peer, connector = _ref10.connector;
        return Promise.resolve(connector.createOffer()).then(function ($await_7) {
          try {
            sdp = $await_7;
            connector.setLocalDescription(sdp);

            peer._setLocalSdp(sdp);

            return $return();
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      });
    }
  }, {
    key: "_createAnswer",
    value: function _createAnswer(_ref11) {
      return new Promise(function ($return, $error) {
        var peer, connector, sdp;
        peer = _ref11.peer, connector = _ref11.connector;
        return Promise.resolve(connector.createAnswer()).then(function ($await_8) {
          try {
            sdp = $await_8;
            connector.setLocalDescription(sdp);

            peer._setLocalSdp(sdp);

            return $return();
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      });
    }
  }, {
    key: "stream",
    get: function get() {
      return this._stream;
    }
  }, {
    key: "peers",
    get: function get() {
      return this._peers;
    }
  }], [{
    key: "support",
    value: function support() {
      return !!getBrowserRTC();
    }
  }]);

  return WebRTC;
}();

var CONFIG = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};

var peerConnector = function peerConnector(_ref) {
  return new Promise(function ($return, $error) {
    var servers, mediaType, _ref$config, config, ws, signal, rtc;

    servers = _ref.servers, mediaType = _ref.mediaType, _ref$config = _ref.config, config = _ref$config === void 0 ? CONFIG : _ref$config;
    return Promise.resolve(normalizeMediaType(mediaType)).then(function ($await_2) {
      try {
        mediaType = $await_2;
        return Promise.resolve(connect$1(servers)).then(function ($await_3) {
          try {
            ws = $await_3;
            signal = new Signal(ws);
            rtc = new WebRTC({
              signal: signal,
              mediaType: mediaType,
              config: config
            });
            return $return(rtc._init());
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
};

var normalizeMediaType = function normalizeMediaType(mediaType) {
  return new Promise(function ($return, $error) {
    mediaType = Object.assign({
      video: true,
      audio: true
    }, mediaType);

    if (mediaType.screen) {
      return Promise.resolve(requestScreen()).then(function ($await_4) {
        try {
          mediaType.video = $await_4;
          mediaType.audio = false;
          delete mediaType.screen;
          return $If_1.call(this);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    }

    function $If_1() {
      return $return(mediaType);
    }

    return $If_1.call(this);
  });
};

module.exports = peerConnector;
