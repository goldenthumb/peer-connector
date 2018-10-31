import Emitter from 'event-emitter';
import PeerBuilder from './PeerBuilder';

export default class Peer {
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