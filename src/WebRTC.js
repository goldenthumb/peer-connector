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
      const channel = peer.createDataChannel(this._channelName);
      if(channel) peer.setDataChannel(channel)

      await this._createOffer(peer);

      signal.sendSdp(peer.id, peer.localSdp);
    });

    signal.on(MESSAGE.SDP, async ({ sender, sdp }) => {
      const peer = this._getPeerOrNew(sender);
      this._emitter.emit('connect', peer);

      if (sdp.type === 'offer') {
        peer.onDataChannel = ({ channel }) => {
          peer.setDataChannel(channel);
        };

        await peer.setRemoteDescription(sdp);
        await this._createAnswer(peer);
        peer._setRemoteSdp(sdp);
        signal.sendSdp(peer.id, peer.localSdp);
      } else {
        await peer.setRemoteDescription(sdp);
        peer._setRemoteSdp(sdp);
      }
    });

    signal.on(MESSAGE.CANDIDATE, ({ sender, candidate }) => {
      const peer = this._getPeerOrNew(sender);
      peer.addIceCandidate(candidate);
    });
  }

  async _createOffer(peer) {
    const sdp = await peer.createOffer();
    peer.setLocalDescription(sdp);
    peer._setLocalSdp(sdp);
  }

  async _createAnswer(peer) {
    const sdp = await peer.createAnswer();
    peer.setLocalDescription(sdp);
    peer._setLocalSdp(sdp);
  }

  _onPeerIceCandidate(peerId, candidate){
    this._signal.sendCandidate(peerId, candidate);
  }
}