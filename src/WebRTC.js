import Emitter from 'event-emitter';
import getBrowserRTC from 'get-browser-rtc';
import randombytes from 'randombytes';

import Peer from './Peer';
import { MESSAGE } from './Signal';

export default class WebRTC {
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
    const peer = new Peer({
      id,
      peer: new RTCPeerConnection(this._config),
    });

    this._peers.set(id, peer);

    return this._peers.get(id);
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
        this._attachPeerEvents(peer);
        peer.onDataChannel = ({ channel }) => {
          peer.setDataChannel(channel);
          peer.attachDataChannel();
        };
        await peer.setRemoteDescription(sdp);
        this._createAnswer(peer);
      } else {
        const peer = this._peers.get(sender);
        await peer.setRemoteDescription(sdp);
      }
    });

    signal.on(MESSAGE.CANDIDATE, ({ sender, candidate }) => {
      const peer = this._peers.get(sender);
      peer.addIceCandidate(candidate);
    });
  }

  _peerConnect(peer) {
    peer.createDataChannel(this._channelName);
    this._attachPeerEvents(peer);
    peer.attachDataChannel();
    this._createOffer(peer);
  }

  _attachPeerEvents(peer) {
    peer.setLocalStream(this._stream);

    peer.onIceCandidate = ({ candidate }) => {
      if (!candidate) return;
      this._signal.sendCandidate(peer.id, candidate);
    };

    peer.onAddStream = ({ stream }) => {
      peer.setRemoteStream(stream);
      this._emitIfConnectedPeer(peer);
    };
  }

  async _createOffer(peer) {
    const sdp = await peer.createOffer();
    peer.setLocalDescription(sdp);
    this._emitIfConnectedPeer(peer);
    this._signal.sendSdp(peer.id, sdp);
  }

  async _createAnswer(peer) {
    const sdp = await peer.createAnswer();
    peer.setLocalDescription(sdp);
    this._emitIfConnectedPeer(peer);
    this._signal.sendSdp(peer.id, sdp);
  }
}