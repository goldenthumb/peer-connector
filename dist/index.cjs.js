'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var detectBrowser = require('detect-browser');
var Emitter = _interopDefault(require('event-emitter'));
var randombytes = _interopDefault(require('randombytes'));
var getBrowserRTC = _interopDefault(require('get-browser-rtc'));

var connect = function connect(_ref) {
  var host = _ref.host,
      port = _ref.port,
      _ref$ssl = _ref.ssl,
      ssl = _ref$ssl === void 0 ? false : _ref$ssl;
  return new Promise(function (resolve, reject) {
    var webSocket = new WebSocket("".concat(ssl ? 'wss' : 'ws', "://").concat(host, ":").concat(port));

    webSocket.onopen = function () {
      return resolve(webSocket);
    };

    webSocket.onerror = function () {
      return reject(new Error('faild connect!'));
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

var PeerBuilder =
/*#__PURE__*/
function () {
  function PeerBuilder(options) {
    _classCallCheck(this, PeerBuilder);

    this._id = options.id;
    this._localSdp = options.localSdp;
    this._remoteSdp = options.remoteSdp;
    this._localStream = options.localStream;
    this._remoteStream = options.remoteStream;
    this._emitter = options.emitter;
    this._dc = options.dc;
  }

  _createClass(PeerBuilder, [{
    key: "on",
    value: function on(eventName, listener) {
      this._emitter.on(eventName, listener);
    }
  }, {
    key: "send",
    value: function send(data) {
      this._dc.value && this._dc.value.send(data);
    }
  }, {
    key: "id",
    get: function get() {
      return this._id;
    }
  }, {
    key: "localSdp",
    get: function get() {
      return this._localSdp;
    }
  }, {
    key: "remoteSdp",
    get: function get() {
      return this._remoteSdp;
    }
  }, {
    key: "localStream",
    get: function get() {
      return this._localStream;
    }
  }, {
    key: "remoteStream",
    get: function get() {
      return this._remoteStream;
    }
  }]);

  return PeerBuilder;
}();

var Peer =
/*#__PURE__*/
function () {
  function Peer(_ref) {
    var id = _ref.id,
        peer = _ref.peer;

    _classCallCheck(this, Peer);

    this.id = id;
    this._peer = peer;
    this._dc = {};
    this._emitter = new Emitter();
    this.localSdp = null;
    this.remoteSdp = null;
    this.localStream = null;
    this.remoteStream = null;
    this.onIceCandidate = null;
    this.onAddStream = null;
    this.onDataChannel = null;
  }

  _createClass(Peer, [{
    key: "isConnected",
    value: function isConnected() {
      return this.localSdp && this.remoteSdp && this.remoteStream;
    }
  }, {
    key: "setRemoteStream",
    value: function setRemoteStream(stream) {
      this.remoteStream = stream;
    }
  }, {
    key: "setLocalStream",
    value: function setLocalStream(stream) {
      this.localStream = stream;

      this._peer.addStream(stream);
    }
  }, {
    key: "setDataChannel",
    value: function setDataChannel(channel) {
      this._dc.value = channel;
    }
  }, {
    key: "setLocalDescription",
    value: function setLocalDescription(sdp) {
      this.localSdp = sdp;
      return this._peer.setLocalDescription(this.localSdp);
    }
  }, {
    key: "setRemoteDescription",
    value: function setRemoteDescription(sdp) {
      this.remoteSdp = sdp;
      return this._peer.setRemoteDescription(this.remoteSdp);
    }
  }, {
    key: "addIceCandidate",
    value: function addIceCandidate(candidate) {
      return this._peer.addIceCandidate(candidate);
    }
  }, {
    key: "createOffer",
    value: function createOffer() {
      return this._peer.createOffer();
    }
  }, {
    key: "createDataChannel",
    value: function createDataChannel(channelName) {
      this._dc.value = this._peer.createDataChannel(channelName);
    }
  }, {
    key: "createAnswer",
    value: function createAnswer() {
      return this._peer.createAnswer();
    }
  }, {
    key: "attachDataChannel",
    value: function attachDataChannel() {
      var _this = this;

      if (this._dc.value) {
        this._dc.value.onmessage = function (_ref2) {
          var data = _ref2.data;
          return _this._emitter.emit('message', data);
        };

        this._dc.value.onclose = function () {
          return _this._emitter.emit('close');
        };

        this._dc.value.onopen = function () {
          return _this._emitter.emit('open');
        };

        this._dc.value.onerror = function (error) {
          if (!_this._emitter.hasListeners(_this._emitter, 'error')) throw error;

          _this._emitter.emit('error', error);
        };
      }
    }
  }, {
    key: "build",
    value: function build() {
      return new PeerBuilder({
        id: this.id,
        localSdp: this.localSdp,
        remoteSdp: this.remoteSdp,
        localStream: this.localStream,
        remoteStream: this.remoteStream,
        emitter: this._emitter,
        dc: this._dc
      });
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

  return Peer;
}();

var WebRTC =
/*#__PURE__*/
function () {
  function WebRTC(_ref) {
    var signal = _ref.signal,
        mediaType = _ref.mediaType;

    _classCallCheck(this, WebRTC);

    if (!WebRTC.support()) {
      throw new Error('Not support getUserMedia API');
    }

    this._emitter = new Emitter();
    this._channelName = randombytes(20).toString('hex');
    this._signal = signal;
    this._peers = new Map();
    this._buildPeers = [];
    this._stream = null;
    this._options = mediaType;
    this._config = {
      iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
      }]
    };
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
      if (peer.isConnected()) {
        var buildPeer = peer.build();

        this._buildPeers.push(buildPeer);

        this._emitter.emit('connect', buildPeer);
      }
    }
  }, {
    key: "_addPeer",
    value: function _addPeer(id) {
      this._peers[id] = new Peer({
        id: id,
        peer: new RTCPeerConnection(this._config)
      });
      return this._peers[id];
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
        var sender = _ref3.sender;

        var peer = _this._addPeer(sender);

        _this._peerConnect(peer);
      });
      signal.on(MESSAGE.SDP, function (_ref4) {
        return new Promise(function ($return, $error) {
          var sender, sdp, peer, _peer;

          sender = _ref4.sender, sdp = _ref4.sdp;

          if (sdp.type === 'offer') {
            peer = _this._addPeer(sender);

            _this._attachAnswerEvents(peer);

            return Promise.resolve(peer.setRemoteDescription(sdp)).then(function ($await_3) {
              try {
                _this._createAnswer(peer);

                return $If_1.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          } else {
            _peer = _this._peers[sender];
            return Promise.resolve(_peer.setRemoteDescription(sdp)).then(function ($await_4) {
              try {
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
      signal.on(MESSAGE.CANDIDATE, function (_ref5) {
        var sender = _ref5.sender,
            candidate = _ref5.candidate;
        var peer = _this._peers[sender];
        peer.addIceCandidate(candidate);
      });
    }
  }, {
    key: "_peerConnect",
    value: function _peerConnect(peer) {
      peer.createDataChannel(this._channelName);

      this._attachOfferEvents(peer);

      this._createOffer(peer);
    }
  }, {
    key: "_attachOfferEvents",
    value: function _attachOfferEvents(peer) {
      var _this2 = this;

      peer.setLocalStream(this._stream);

      peer.onIceCandidate = function (_ref6) {
        var candidate = _ref6.candidate;
        if (!candidate) return;

        _this2._signal.sendCandidate(peer.id, candidate);
      };

      peer.onAddStream = function (_ref7) {
        var stream = _ref7.stream;
        peer.setRemoteStream(stream);

        _this2._emitIfConnectedPeer(peer);
      };

      peer.attachDataChannel();
    }
  }, {
    key: "_createOffer",
    value: function _createOffer(peer) {
      return new Promise(function ($return, $error) {
        var sdp;
        return Promise.resolve(peer.createOffer()).then(function ($await_5) {
          try {
            sdp = $await_5;
            peer.setLocalDescription(sdp);

            this._emitIfConnectedPeer(peer);

            this._signal.sendSdp(peer.id, sdp);

            return $return();
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  }, {
    key: "_attachAnswerEvents",
    value: function _attachAnswerEvents(peer) {
      var _this3 = this;

      peer.setLocalStream(this._stream);

      peer.onIceCandidate = function (_ref8) {
        var candidate = _ref8.candidate;
        if (!candidate) return;

        _this3._signal.sendCandidate(peer.id, candidate);
      };

      peer.onAddStream = function (_ref9) {
        var stream = _ref9.stream;
        peer.setRemoteStream(stream);

        _this3._emitIfConnectedPeer(peer);
      };

      peer.onDataChannel = function (_ref10) {
        var channel = _ref10.channel;
        peer.setDataChannel(channel);
        peer.attachDataChannel();
      };
    }
  }, {
    key: "_createAnswer",
    value: function _createAnswer(peer) {
      return new Promise(function ($return, $error) {
        var sdp;
        return Promise.resolve(peer.createAnswer()).then(function ($await_6) {
          try {
            sdp = $await_6;
            peer.setLocalDescription(sdp);

            this._emitIfConnectedPeer(peer);

            this._signal.sendSdp(peer.id, sdp);

            return $return();
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  }, {
    key: "stream",
    get: function get() {
      return this._stream;
    }
  }, {
    key: "peers",
    get: function get() {
      return this._buildPeers;
    }
  }], [{
    key: "support",
    value: function support() {
      return !!getBrowserRTC();
    }
  }]);

  return WebRTC;
}();

var peerConnector = function peerConnector(_ref) {
  return new Promise(function ($return, $error) {
    var servers, mediaType, ws, signal, rtc;
    servers = _ref.servers, mediaType = _ref.mediaType;
    return Promise.resolve(normalizeMediaType(mediaType)).then(function ($await_2) {
      try {
        mediaType = $await_2;
        return Promise.resolve(connect$1(servers)).then(function ($await_3) {
          try {
            ws = $await_3;
            signal = new Signal(ws);
            rtc = new WebRTC({
              signal: signal,
              mediaType: mediaType
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
