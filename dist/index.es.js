import { detect } from 'detect-browser';
import Emitter from 'event-emitter';
import randombytes from 'randombytes';
import getBrowserRTC from 'get-browser-rtc';

const connect = ({ host, port, ssl = false }) => {
  return new Promise((resolve, reject) => {
    const webSocket = new WebSocket(`${ssl ? 'wss' : 'ws'}://${host}:${port}`);
    webSocket.onopen = () => resolve(webSocket);
    webSocket.onerror = () => reject(new Error('faild connect!'));
  });
};

var connect$1 = async (servers) => {
  for (const server of servers) {
    try {
      return await connect(server);
    } catch (error) {
      continue;
    }
  }
};

const userAgent = detect();

const EXTENSION_ID = 'mopiaiibclcaiolndiidmkpejmcpjmcf';
const EXTENSION_URL = `https://chrome.google.com/webstore/detail/screen-sharing-extension/${EXTENSION_ID}`;

var requestScreen = async () => {
  if (!isSupport()) {
    throw new Error('not support browser');
  }

  if (userAgent.name === 'firefox') {
    return { mediaSource: 'screen' };
  }

  if (userAgent.name === 'chrome') {
    return {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: await getStreamId(),
        maxWidth: window.screen.width,
        maxHeight: window.screen.height
      }
    };
  }
};

const isSupport = () => {
  const browser = userAgent.name;
  return browser === 'chrome' || browser === 'firefox';
};

const getStreamId = async () => {
  if (!await isInstalledExtension()) {
    window.location.href = EXTENSION_URL;
  }

  window.postMessage({ type: 'SCREEN_REQUEST', text: 'start' }, '*');

  return await new Promise(resolve => {
    window.addEventListener('message', function listener({ data: { type, streamId } }) {
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

const isInstalledExtension = async () => {
  const img = document.createElement('img');
  img.src = `chrome-extension://${EXTENSION_ID}/icon.png`;

  return await new Promise((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
};

const MESSAGE = {
  JOIN: '/PEER_CONNECTOR/join',
  REQUEST_CONNECT: '/PEER_CONNECTOR/request/peer-connect',
  SDP: '/PEER_CONNECTOR/sdp',
  CANDIDATE: '/PEER_CONNECTOR/candidate'
};

class Signal {
  constructor(webSocket) {
    this._emitter = new Emitter();
    this._ws = webSocket;
    this._ws.onmessage = this._onMessage.bind(this);
    this._id = randombytes(20).toString('hex');

    this._onMessage();
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  join() {
    this._send(MESSAGE.JOIN, { sender: this._id });
  }

  requestPeer(receiver) {
    this._send(MESSAGE.REQUEST_CONNECT, {
      receiver,
      sender: this._id
    });
  }

  sendSdp(receiver, sdp) {
    this._send(MESSAGE.SDP, {
      receiver,
      sender: this._id,
      sdp
    });
  }

  sendCandidate(receiver, candidate) {
    this._send(MESSAGE.CANDIDATE, {
      receiver,
      sender: this._id,
      candidate
    });
  }

  _onMessage(message) {
    if (!message) return;
    const { event, data } = JSON.parse(message.data);

    if (this._equalId(data)) this._emitter.emit(event, data);
  }

  _send(event, data) {
    this._ws.send(JSON.stringify({ event, data }));
  }

  _equalId(data) {
    return !data.receiver || data.receiver === this._id
  }
}

class PeerBuilder {
  constructor(options) {
    this._id = options.id;
    this._localSdp = options.localSdp;
    this._remoteSdp = options.remoteSdp;
    this._localStream = options.localStream;
    this._remoteStream = options.remoteStream;
    this._emitter = options.emitter;
    this._dc = options.dc;
  }

  get id() {
    return this._id;
  }

  get localSdp() {
    return this._localSdp;
  }

  get remoteSdp() {
    return this._remoteSdp;
  }

  get localStream() {
    return this._localStream;
  }

  get remoteStream() {
    return this._remoteStream;
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  send(data) {
    this._dc.value && this._dc.value.send(data);
  }
}

class Peer {
  constructor({ id, peer }) {
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

  isConnected() {
    return this.localSdp && this.remoteSdp && this.remoteStream;
  }

  set onIceCandidate(func) {
    this._peer.onicecandidate = func;
  }

  set onAddStream(func) {
    this._peer.onaddstream = func;
  }

  set onDataChannel(func) {
    this._peer.ondatachannel = func;
  }

  setRemoteStream(stream) {
    this.remoteStream = stream;
  }

  setLocalStream(stream) {
    this.localStream = stream;
    this._peer.addStream(stream);
  }

  setDataChannel(channel) {
    this._dc.value = channel;
  }

  setLocalDescription(sdp) {
    this.localSdp = sdp;
    return this._peer.setLocalDescription(this.localSdp);
  }

  setRemoteDescription(sdp) {
    this.remoteSdp = sdp;
    return this._peer.setRemoteDescription(this.remoteSdp);
  }

  addIceCandidate(candidate) {
    return this._peer.addIceCandidate(candidate);
  }

  createOffer() {
    return this._peer.createOffer();
  }

  createDataChannel(channelName) {
    this._dc.value = this._peer.createDataChannel(channelName);
  }

  createAnswer() {
    return this._peer.createAnswer();
  }

  attachDataChannel() {
    if (this._dc.value) {
      this._dc.value.onmessage = ({ data }) => this._emitter.emit('message', data);
      this._dc.value.onclose = () => this._emitter.emit('close');
      this._dc.value.onopen = () => this._emitter.emit('open');
      this._dc.value.onerror = (error) => {
        if (!this._emitter.hasListeners(this._emitter, 'error')) throw error;
        this._emitter.emit('error', error);
      };
    }
  }

  build() {
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
}

class WebRTC {
  constructor({ signal, mediaType }) {
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
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
  }

  static support() {
    return !!getBrowserRTC();
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  get stream() {
    return this._stream;
  }

  get peers() {
    return this._buildPeers;
  }

  async _init() {
    this._stream = await navigator.mediaDevices.getUserMedia(this._options);
    this._onMessage();
    return this;
  }

  _emitIfConnectedPeer(peer) {
    if (peer.isConnected()) {
      const buildPeer = peer.build();
      this._buildPeers.push(buildPeer);

      this._emitter.emit('connect', buildPeer);
    }
  }

  _addPeer(id) {
    this._peers[id] = new Peer({
      id,
      peer: new RTCPeerConnection(this._config)
    });

    return this._peers[id];
  }

  _onMessage() {
    const signal = this._signal;

    signal.join();

    signal.on(MESSAGE.JOIN, ({ sender }) => {
      signal.requestPeer(sender);
    });

    signal.on(MESSAGE.REQUEST_CONNECT, ({ sender }) => {
      const peer = this._addPeer(sender);
      this._peerConnect(peer);
    });

    signal.on(MESSAGE.SDP, async ({ sender, sdp }) => {
      if (sdp.type === 'offer') {
        const peer = this._addPeer(sender);
        this._attachAnswerEvents(peer);
        await peer.setRemoteDescription(sdp);
        this._createAnswer(peer);
      } else {
        const peer = this._peers[sender];
        await peer.setRemoteDescription(sdp);
      }
    });

    signal.on(MESSAGE.CANDIDATE, ({ sender, candidate }) => {
      const peer = this._peers[sender];
      peer.addIceCandidate(candidate);
    });
  }

  _peerConnect(peer) {
    peer.createDataChannel(this._channelName);

    this._attachOfferEvents(peer);
    this._createOffer(peer);
  }

  _attachOfferEvents(peer) {
    peer.setLocalStream(this._stream);

    peer.onIceCandidate = ({ candidate }) => {
      if (!candidate) return;
      this._signal.sendCandidate(peer.id, candidate);
    };

    peer.onAddStream = ({ stream }) => {
      peer.setRemoteStream(stream);
      this._emitIfConnectedPeer(peer);
    };

    peer.attachDataChannel();
  }

  async _createOffer(peer) {
    const sdp = await peer.createOffer();
    peer.setLocalDescription(sdp);
    this._emitIfConnectedPeer(peer);
    this._signal.sendSdp(peer.id, sdp);
  }

  _attachAnswerEvents(peer) {
    peer.setLocalStream(this._stream);

    peer.onIceCandidate = ({ candidate }) => {
      if (!candidate) return;
      this._signal.sendCandidate(peer.id, candidate);
    };

    peer.onAddStream = ({ stream }) => {
      peer.setRemoteStream(stream);
      this._emitIfConnectedPeer(peer);
    };

    peer.onDataChannel = ({ channel }) => {
      peer.setDataChannel(channel);
      peer.attachDataChannel();
    };
  }

  async _createAnswer(peer) {
    const sdp = await peer.createAnswer();
    peer.setLocalDescription(sdp);
    this._emitIfConnectedPeer(peer);
    this._signal.sendSdp(peer.id, sdp);
  }
}

const peerConnector = async ({ servers, mediaType }) => {
  mediaType = await normalizeMediaType(mediaType);

  const ws = await connect$1(servers);
  const signal = new Signal(ws);
  const rtc = new WebRTC({ signal, mediaType });

  return rtc._init();
};

const normalizeMediaType = async (mediaType) => {
  mediaType = Object.assign({ video: true, audio: true }, mediaType);

  if (mediaType.screen) {
    mediaType.video = await requestScreen();
    mediaType.audio = false;
    delete mediaType.screen;
  }

  return mediaType;
};

export default peerConnector;
