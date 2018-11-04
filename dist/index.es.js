import { detect } from 'detect-browser';
import Emitter from 'event-emitter';
import randombytes from 'randombytes';
import getBrowserRTC from 'get-browser-rtc';

const connect = ({ host, port, username, password, ssl = false }) => {
  return new Promise((resolve, reject) => {
    const accessAuth = username && password ? `${username}:${password}@`: '';
    const webSocket = new WebSocket(`${ssl ? 'wss' : 'ws'}://${accessAuth}${host}:${port}`);

    webSocket.onopen = () => resolve(webSocket);
    webSocket.onerror = () => reject(new Error('connect failed.'));
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

class Peer {
  constructor(id) {
    this.id = id;
    this._dc = null;
    this._emitter = new Emitter();
    this.localSdp = null;
    this.remoteSdp = null;
    this.localStream = null;
    this.remoteStream = null;
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  send(data) {
    this._dc && this._dc.send(data);
  }

  _isConnected() {
    return this.localSdp && this.remoteSdp && this.remoteStream;
  }

  _setLocalStream(stream) {
    this.localStream = stream;
  }

  _setRemoteStream(stream) {
    this.remoteStream = stream;
  }

  _setDataChannel(channel) {
    this._dc = channel;
  }

  _setLocalSdp(sdp) {
    this.localSdp = sdp;
  }

  _setRemoteSdp(sdp) {
    this.remoteSdp = sdp;
  }

  _attachDataChannel() {
    this._dc.onmessage = ({ data }) => this._emitter.emit('message', data);
    this._dc.onclose = () => this._emitter.emit('close');
    this._dc.onopen = () => this._emitter.emit('open');
    this._dc.onerror = (error) => {
      if (!this._emitter.hasListeners(this._emitter, 'error')) throw error;
      this._emitter.emit('error', error);
    };
  }
}

class Connector {
  constructor(peer) {
    this._peer = peer;
    this.onIceCandidate = null;
    this.onAddStream = null;
    this.onDataChannel = null;
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

  createOffer() {
    return this._peer.createOffer();
  }

  createAnswer() {
    return this._peer.createAnswer();
  }

  createDataChannel(channelName) {
    return this._peer.createDataChannel(channelName);
  }

  addStream(stream) {
    return this._peer.addStream(stream);
  }

  setLocalDescription(sdp) {
    return this._peer.setLocalDescription(sdp);
  }

  setRemoteDescription(sdp) {
    return this._peer.setRemoteDescription(sdp);
  }

  addIceCandidate(candidate) {
    return this._peer.addIceCandidate(candidate);
  }
}

class WebRTC {
  constructor({ signal, mediaType, config }) {
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
    return this._peers;
  }

  async _init() {
    this._stream = await navigator.mediaDevices.getUserMedia(this._options);
    this._onMessage();
    return this;
  }

  _emitIfConnectedPeer(peer) {
    if (peer._isConnected()) {
      this._emitter.emit('connect', peer);
    }
  }

  _addPeer(id) {
    const peer = new Peer(id);
    const connector = new Connector(new RTCPeerConnection(this._config));

    this._peers.set(id, peer);
    this._connectors.set(id, connector);

    return this._peers.get(id);
  }

  _onMessage() {
    const signal = this._signal;

    signal.join();

    signal.on(MESSAGE.JOIN, ({ sender }) => {
      signal.requestPeer(sender);
    });

    signal.on(MESSAGE.REQUEST_CONNECT, async ({ sender }) => {
      const peer = this._addPeer(sender);
      const connector = this._connectors.get(sender);
      const channel = connector.createDataChannel(this._channelName);

      peer._setDataChannel(channel);
      peer._attachDataChannel();

      this._attachEvents({ peer, connector });
      await this._createOffer({ peer, connector });

      this._emitIfConnectedPeer(peer);
      signal.sendSdp(peer.id, peer.localSdp);
    });

    signal.on(MESSAGE.SDP, async ({ sender, sdp }) => {
      if (sdp.type === 'offer') {
        const peer = this._addPeer(sender);
        const connector = this._connectors.get(sender);

        this._attachEvents({ peer, connector });

        connector.onDataChannel = ({ channel }) => {
          peer._setDataChannel(channel);
          peer._attachDataChannel();
        };

        await connector.setRemoteDescription(sdp);
        await this._createAnswer({ peer, connector });
        peer._setRemoteSdp(sdp);

        this._emitIfConnectedPeer(peer);
        signal.sendSdp(peer.id, peer.localSdp);
      } else {
        const peer = this._peers.get(sender);
        const connector = this._connectors.get(sender);

        await connector.setRemoteDescription(sdp);
        peer._setRemoteSdp(sdp);

        this._emitIfConnectedPeer(peer);
      }
    });

    signal.on(MESSAGE.CANDIDATE, ({ sender, candidate }) => {
      const connector = this._connectors.get(sender);
      connector.addIceCandidate(candidate);
    });
  }

  _attachEvents({ peer, connector }) {
    peer._setLocalStream(this._stream);
    connector.addStream(this._stream);

    connector.onIceCandidate = ({ candidate }) => {
      if (!candidate) return;
      this._signal.sendCandidate(peer.id, candidate);
    };

    connector.onAddStream = ({ stream }) => {
      peer._setRemoteStream(stream);
      this._emitIfConnectedPeer(peer);
    };
  }

  async _createOffer({ peer, connector }) {
    const sdp = await connector.createOffer();
    connector.setLocalDescription(sdp);
    peer._setLocalSdp(sdp);
  }

  async _createAnswer({ peer, connector }) {
    const sdp = await connector.createAnswer();
    connector.setLocalDescription(sdp);
    peer._setLocalSdp(sdp);
  }
}

const CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const peerConnector = async ({ servers, mediaType, config = CONFIG }) => {
  mediaType = await normalizeMediaType(mediaType);

  const ws = await connect$1(servers);
  const signal = new Signal(ws);
  const rtc = new WebRTC({ signal, mediaType, config });

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
