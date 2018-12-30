import Emitter from 'event-emitter';
import randombytes from 'randombytes';

import Peer from './Peer';
import { MESSAGE } from './Signal';

export default class WebRTC {
  constructor({ signal, mediaType, config }) {
    this._emitter = new Emitter();
    this._channelName = randombytes(20).toString('hex');
    this._peers = new Map();
    this._stream = null;
    this._signal = signal;
    this._mediaType = mediaType;
    this._config = config;

    this._onPeerIceCandidate = this._onPeerIceCandidate.bind(this)
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
    this._stream = await navigator.mediaDevices.getUserMedia(this._mediaType);
    this._onMessage();
    return this;
  }

  _getPeerOrNew(id) {
    return this._peers.get(id) || this._newPeer(id);
  }

  _newPeer(id) {
    const peer = new Peer({
      id, 
      peerConnection: new RTCPeerConnection(this._config), 
      localStream: this.stream, 
      onIceCandidate: this._onPeerIceCandidate
    });

    this._peers.set(id, peer);
    return peer;
  }

  _onMessage() {
    const signal = this._signal;

    signal.join();

    signal.on(MESSAGE.JOIN, ({ sender }) => {
      signal.requestPeer(sender);
    });

    signal.on(MESSAGE.REQUEST_CONNECT, async ({ sender }) => {
      const peer = this._newPeer(sender);
      peer.createDataChannel(this._channelName);
      signal.sendSdp(peer.id, await peer.createOfferSdp());
    });

    signal.on(MESSAGE.SDP, async ({ sender, sdp }) => {
      const peer = this._getPeerOrNew(sender);
      this._emitter.emit('connect', peer);
      
      await peer.setRemoteDescription(sdp);
      peer._setRemoteSdp(sdp);

      if (sdp.type === 'offer'){
        signal.sendSdp(peer.id, await peer.createAnswerSdp());
      }
    });

    signal.on(MESSAGE.CANDIDATE, ({ sender, candidate }) => {
      const peer = this._getPeerOrNew(sender);
      peer.addIceCandidate(candidate);
    });
  }

  _onPeerIceCandidate(peerId, candidate){
    this._signal.sendCandidate(peerId, candidate);
  }
}