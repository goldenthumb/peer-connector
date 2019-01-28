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
    switch (userAgent.name) {
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
});

var getStreamId = function getStreamId() {
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
};

var isInstalledExtension = function isInstalledExtension() {
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

var Peer =
/*#__PURE__*/
function () {
  function Peer(_ref) {
    var id = _ref.id,
        peerConnection = _ref.peerConnection,
        localStream = _ref.localStream;

    _classCallCheck(this, Peer);

    this._id = id;
    this._pc = peerConnection;
    this._dc = null;
    this._emitter = new Emitter();
    this._localSdp = null;
    this._remoteSdp = null;
    this._remoteStream = null;
    this._localStream = localStream;
    this._isConnected = false;

    this._init();
  }

  _createClass(Peer, [{
    key: "createDataChannel",
    value: function createDataChannel(channelName) {
      if (!this._pc.createDataChannel) return;

      this._setDataChannel(this._pc.createDataChannel(channelName));
    }
  }, {
    key: "setRemoteDescription",
    value: function setRemoteDescription(sdp) {
      return this._pc.setRemoteDescription(new RTCSessionDescription(this._remoteSdp = sdp));
    }
  }, {
    key: "addIceCandidate",
    value: function addIceCandidate(candidate) {
      return this._pc.addIceCandidate(candidate);
    }
  }, {
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
    key: "_setDataChannel",
    value: function _setDataChannel(dc) {
      var _this = this;

      this._dc = dc;

      dc.onmessage = function (_ref2) {
        var data = _ref2.data;
        return _this._emitter.emit('message', data);
      };

      dc.onclose = function () {
        return _this._emitter.emit('close');
      };

      dc.onopen = function () {
        return _this._emitter.emit('open');
      };

      dc.onerror = function (error) {
        if (!_this._emitter.hasListeners(_this._emitter, 'error')) throw error;

        _this._emitter.emit('error', error);
      };
    }
  }, {
    key: "_init",
    value: function _init() {
      var _this2 = this;

      var localStream = this.localStream;
      localStream.getTracks().forEach(function (track) {
        return _this2._pc.addTrack(track, localStream);
      });

      this._pc.onicecandidate = function (_ref3) {
        var candidate = _ref3.candidate;
        if (candidate) _this2._emitter.emit('onIceCandidate', candidate);
      };

      this._pc.ontrack = function (_ref4) {
        var streams = _ref4.streams;
        if (!_this2._remoteStream) _this2._emitter.emit('stream', _this2._remoteStream = streams[0]);
      };

      this._pc.ondatachannel = function (_ref5) {
        var channel = _ref5.channel;
        return _this2._setDataChannel(channel);
      };

      this._pc.oniceconnectionstatechange = function () {
        if (!_this2._isConnected && _this2._pc.iceConnectionState === 'connected') _this2._emitter.emit('connect');
      };
    }
  }, {
    key: "createOfferSdp",
    value: function createOfferSdp() {
      return new Promise(function ($return, $error) {
        return Promise.resolve(this._pc.createOffer()).then(function ($await_1) {
          try {
            this._localSdp = $await_1;

            this._pc.setLocalDescription(this._localSdp);

            return $return(this._localSdp);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  }, {
    key: "createAnswerSdp",
    value: function createAnswerSdp() {
      return new Promise(function ($return, $error) {
        return Promise.resolve(this._pc.createAnswer()).then(function ($await_2) {
          try {
            this._localSdp = $await_2;

            this._pc.setLocalDescription(this._localSdp);

            return $return(this._localSdp);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  }, {
    key: "id",
    get: function get() {
      return this._id;
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
  }]);

  return Peer;
}();

var MESSAGE = {
  JOIN: '/PEER_CONNECTOR/join',
  REQUEST_CONNECT: '/PEER_CONNECTOR/request/peer-connect',
  SDP: '/PEER_CONNECTOR/sdp',
  CANDIDATE: '/PEER_CONNECTOR/candidate'
};

var Signal =
/*#__PURE__*/
function () {
  function Signal(_ref) {
    var webSocket = _ref.webSocket,
        config = _ref.config,
        rtc = _ref.rtc;

    _classCallCheck(this, Signal);

    this._emitter = new Emitter();
    this._ws = webSocket;
    this._id = randombytes(20).toString('hex');
    this._rtc = rtc;
    this._config = config;
    webSocket.onmessage = this._onMessage.bind(this);
  }

  _createClass(Signal, [{
    key: "_on",
    value: function _on(eventName, listener) {
      this._emitter.on(eventName, listener);
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
    value: function _send(event) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this._ws.send(JSON.stringify({
        event: event,
        data: Object.assign({}, data, {
          sender: this._id
        })
      }));
    }
  }, {
    key: "_equalId",
    value: function _equalId(data) {
      return !data.receiver || data.receiver === this._id;
    }
  }, {
    key: "signaling",
    value: function signaling() {
      var _this = this;

      this._send(MESSAGE.JOIN);

      this._on(MESSAGE.JOIN, function (_ref2) {
        var sender = _ref2.sender;

        _this._send(MESSAGE.REQUEST_CONNECT, {
          receiver: sender
        });
      });

      this._on(MESSAGE.REQUEST_CONNECT, function (_ref3) {
        return new Promise(function ($return, $error) {
          var sender, peer;
          sender = _ref3.sender;
          peer = _this._createPeer(sender);
          peer.createDataChannel(_this._id);
          return Promise.resolve(peer.createOfferSdp()).then(function ($await_2) {
            try {
              _this._send(MESSAGE.SDP, {
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

      this._on(MESSAGE.SDP, function (_ref4) {
        return new Promise(function ($return, $error) {
          var sender, sdp, peer;
          sender = _ref4.sender, sdp = _ref4.sdp;
          peer = _this._getPeerOrCreate(sender);
          return Promise.resolve(peer.setRemoteDescription(sdp)).then(function ($await_3) {
            try {
              if (sdp.type === 'offer') {
                return Promise.resolve(peer.createAnswerSdp()).then(function ($await_4) {
                  try {
                    _this._send(MESSAGE.SDP, {
                      receiver: peer.id,
                      sdp: $await_4
                    });

                    return $If_1.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              function $If_1() {
                return $return();
              }

              return $If_1.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        });
      });

      this._on(MESSAGE.CANDIDATE, function (_ref5) {
        var sender = _ref5.sender,
            candidate = _ref5.candidate;

        var peer = _this._getPeerOrCreate(sender);

        peer.addIceCandidate(candidate);
      });
    }
  }, {
    key: "_createPeer",
    value: function _createPeer(peerId) {
      var _this2 = this;

      var peer = new Peer({
        id: peerId,
        peerConnection: new RTCPeerConnection(this._config),
        localStream: this._rtc.stream
      });
      peer.on('onIceCandidate', function (candidate) {
        return _this2._send(MESSAGE.CANDIDATE, {
          receiver: peer.id,
          candidate: candidate
        });
      });

      this._rtc.addNewPeer(peer);

      return peer;
    }
  }, {
    key: "_getPeerOrCreate",
    value: function _getPeerOrCreate(peerId) {
      var peers = this._rtc.peers;
      return peers.has(peerId) ? peers.get(peerId) : this._createPeer(peerId);
    }
  }]);

  return Signal;
}();

var WebRTC =
/*#__PURE__*/
function () {
  function WebRTC(stream) {
    _classCallCheck(this, WebRTC);

    this._emitter = new Emitter();
    this._peers = new Map();
    this._stream = stream;
  }

  _createClass(WebRTC, [{
    key: "on",
    value: function on(eventName, listener) {
      this._emitter.on(eventName, listener);
    }
  }, {
    key: "addNewPeer",
    value: function addNewPeer(peer) {
      var _this = this;

      this.peers.set(peer.id, peer);
      peer.on('connect', function () {
        return _this._emitter.emit('connect', peer);
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
    var servers, mediaType, _ref$config, config, rtc, signal;

    servers = _ref.servers, mediaType = _ref.mediaType, _ref$config = _ref.config, config = _ref$config === void 0 ? CONFIG : _ref$config;

    if (!getBrowserRTC()) {
      return $error(new Error('Not support getUserMedia API'));
    }

    return Promise.resolve(normalizeMediaType(mediaType)).then(function ($await_2) {
      try {
        mediaType = $await_2;
        return Promise.resolve(navigator.mediaDevices.getUserMedia(mediaType)).then(function ($await_3) {
          try {
            rtc = new WebRTC($await_3);
            return Promise.resolve(connect$1(servers)).then(function ($await_4) {
              try {
                signal = new Signal({
                  rtc: rtc,
                  config: config,
                  webSocket: $await_4
                });
                signal.signaling();
                return $return(rtc);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }, $error);
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
      return Promise.resolve(requestScreen()).then(function ($await_5) {
        try {
          mediaType.video = $await_5;
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
