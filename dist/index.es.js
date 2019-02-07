import { detect } from 'detect-browser';
import Emitter from 'event-emitter';
import randombytes from 'randombytes';
import getBrowserRTC from 'get-browser-rtc';

const connect = ({ host, port, username, password, ssl = false }) => {
  return new Promise((resolve, reject) => {
    const accessAuth = username && password ? `${username}:${password}@` : '';
    const webSocket = new WebSocket(`${ssl ? 'wss' : 'ws'}://${accessAuth}${host}:${port}`);

    webSocket.onopen = () => resolve(webSocket);
    webSocket.onerror = () => reject(new Error('connect failed.'));
  });
};

var connect$1 = async servers => {
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
  switch (userAgent.name) {
    case 'firefox':
      return { mediaSource: 'screen' };
    case 'chrome':
      if (!await isInstalledExtension()) {
        window.location.href = EXTENSION_URL;
      }

      return {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: await getStreamId(),
          maxWidth: window.screen.width,
          maxHeight: window.screen.height
        }
      };
    default:
      throw new Error('not support browser');
  }
};

const getStreamId = () => new Promise(resolve => {
  window.postMessage({ type: 'SCREEN_REQUEST', text: 'start' }, '*');
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

const isInstalledExtension = () => new Promise(resolve => {
  const img = document.createElement('img');
  img.src = `chrome-extension://${EXTENSION_ID}/icon.png`;
  img.onload = () => resolve(true);
  img.onerror = () => resolve(false);
});

class Peer {
  constructor({ id, peerConnection, localStream }) {
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

  get id() {
    return this._id;
  }

  get localStream() {
    return this._localStream;
  }

  get remoteStream() {
    return this._remoteStream;
  }

  get localSdp() {
    return this._localSdp;
  }

  get remoteSdp() {
    return this._remoteSdp;
  }

  createDataChannel(channelName) {
    if (!this._pc.createDataChannel) return;
    this._setDataChannel(this._pc.createDataChannel(channelName));
  }

  setRemoteDescription(sdp) {
    return this._pc.setRemoteDescription(new RTCSessionDescription(this._remoteSdp = sdp));
  }

  addIceCandidate(candidate) {
    return this._pc.addIceCandidate(candidate);
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  send(data) {
    this._dc && this._dc.send(data);
  }

  _setDataChannel(dc) {
    this._dc = dc;

    dc.onmessage = ({ data }) => this._emitter.emit('message', data);
    dc.onclose = () => this._emitter.emit('close');
    dc.onopen = () => this._emitter.emit('open');
    dc.onerror = (error) => {
      if (!this._emitter.hasListeners(this._emitter, 'error')) throw error;
      this._emitter.emit('error', error);
    };
  }

  _init() {
    const localStream = this.localStream;
    localStream.getTracks().forEach(track => this._pc.addTrack(track, localStream));

    this._pc.onicecandidate = ({ candidate }) => {
      if (candidate) this._emitter.emit('onIceCandidate', candidate);
    };

    this._pc.ontrack = ({ streams }) => {
      if (!this._remoteStream) this._emitter.emit('stream', this._remoteStream = streams[0]);
    };

    this._pc.ondatachannel = ({ channel }) => this._setDataChannel(channel);

    this._pc.oniceconnectionstatechange = () => {
      if (!this._isConnected && this._pc.iceConnectionState === 'connected') this._emitter.emit('connect');
    };
  }

  async createOfferSdp() {
    this._localSdp = await this._pc.createOffer();
    this._pc.setLocalDescription(this._localSdp);
    return this._localSdp;
  }

  async createAnswerSdp() {
    this._localSdp = await this._pc.createAnswer();
    this._pc.setLocalDescription(this._localSdp);
    return this._localSdp;
  }
}

const MESSAGE = {
  JOIN: '/PEER_CONNECTOR/join',
  REQUEST_CONNECT: '/PEER_CONNECTOR/request/peer-connect',
  SDP: '/PEER_CONNECTOR/sdp',
  CANDIDATE: '/PEER_CONNECTOR/candidate'
};

class Signal {
  constructor({ webSocket, config, rtc }) {
    this._emitter = new Emitter();
    this._ws = webSocket;
    this._id = randombytes(20).toString('hex');
    this._rtc = rtc;
    this._config = config;

    webSocket.onmessage = this._onMessage.bind(this);
  }

  _on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  _onMessage(message) {
    if (!message) return;
    const { event, data } = JSON.parse(message.data);
    if (this._equalId(data)) this._emitter.emit(event, data);
  }

  _send(event, data = {}) {
    this._ws.send(JSON.stringify({ event, data: { ...data, sender: this._id } }));
  }

  _equalId(data) {
    return !data.receiver || data.receiver === this._id;
  }

  signaling() {
    this._send(MESSAGE.JOIN);

    this._on(MESSAGE.JOIN, ({ sender }) => {
      this._send(MESSAGE.REQUEST_CONNECT, { receiver: sender });
    });

    this._on(MESSAGE.REQUEST_CONNECT, async ({ sender }) => {
      const peer = this._createPeer(sender);
      peer.createDataChannel(this._id);
      this._send(MESSAGE.SDP, { receiver: peer.id, sdp: await peer.createOfferSdp() });
    });

    this._on(MESSAGE.SDP, async ({ sender, sdp }) => {
      const peer = this._getPeerOrCreate(sender);
      await peer.setRemoteDescription(sdp);

      if (sdp.type === 'offer') {
        this._send(MESSAGE.SDP, { receiver: peer.id, sdp: await peer.createAnswerSdp() });
      }
    });

    this._on(MESSAGE.CANDIDATE, ({ sender, candidate }) => {
      const peer = this._getPeerOrCreate(sender);
      peer.addIceCandidate(candidate);
    });
  }

  _createPeer(peerId) {
    const peer = new Peer({
      id: peerId,
      peerConnection: new RTCPeerConnection(this._config),
      localStream: this._rtc.stream,
    });

    peer.on('onIceCandidate', candidate => this._send(MESSAGE.CANDIDATE, { receiver: peer.id, candidate }));
    this._rtc.addNewPeer(peer);

    return peer;
  }

  _getPeerOrCreate(peerId) {
    const peers = this._rtc.peers;
    return peers.has(peerId) ? peers.get(peerId) : this._createPeer(peerId);
  }
}

class WebRTC {
  constructor(stream) {
    this._emitter = new Emitter();
    this._peers = new Map();
    this._stream = stream;
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  get stream() {
    return this._stream;
  }

  get peers() {
    return this._peers;
  }

  addNewPeer(peer) {
    this.peers.set(peer.id, peer);
    peer.on('connect', () => this._emitter.emit('connect', peer));
  }
}

const CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const peerConnector = async ({ servers, mediaType, config }) => {
  if (!getBrowserRTC()) {
    throw new Error('Not support getUserMedia API');
  }

  const stream = await (mediaType.screen ? getDisplayMedia() : getUserMedia(mediaType));
  const rtc = new WebRTC(stream);
  const signal = new Signal({ rtc, config: Object.assign(CONFIG, config), webSocket: await connect$1(servers) });
  signal.signaling();

  return rtc;
};

const getDisplayMedia = () => {
  if (navigator.getDisplayMedia) {
    return navigator.getDisplayMedia({ video: true });
  } else if (navigator.mediaDevices.getDisplayMedia) {
    return navigator.mediaDevices.getDisplayMedia({ video: true });
  } else {
    return navigator.mediaDevices.getUserMedia({ video: requestScreen() });
  }
};

const getUserMedia = (mediaType) => {
  return navigator.mediaDevices.getUserMedia({
    video: mediaType.video || true,
    audio: mediaType.audio || true
  });
};

export default peerConnector;
