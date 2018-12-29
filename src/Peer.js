import Emitter from 'event-emitter';

export default class Peer {
  constructor(id, peer) {
    this.id = id;
    this._peer = peer;
    this._dc = null;
    this._emitter = new Emitter();
    this.localSdp = null;
    this.remoteSdp = null;
    this.localStream = null;
    this.remoteStream = null;
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
    if (!this._peer.createDataChannel) return;
    return this._peer.createDataChannel(channelName);
  }

  setLocalDescription(sdp) {
    return this._peer.setLocalDescription(sdp);
  }

  setRemoteDescription(sdp) {
    return this._peer.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  addIceCandidate(candidate) {
    return this._peer.addIceCandidate(candidate);
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  send(data) {
    this._dc && this._dc.send(data);
  }

  setDataChannel(dc) {
    this._dc = dc;

    dc.onmessage = ({ data }) => this._emitter.emit('message', data);
    dc.onclose = () => this._emitter.emit('close');
    dc.onopen = () => this._emitter.emit('open');
    dc.onerror = (error) => {
      if (!this._emitter.hasListeners(this._emitter, 'error')) throw error;
      this._emitter.emit('error', error);
    };
  }

  _setLocalSdp(sdp) {
    this.localSdp = sdp;
  }

  _setRemoteSdp(sdp) {
    this.remoteSdp = sdp;
  }

  attachEvents(localStream, onIceCandidate) {
    this.localStream = localStream;
    localStream.getTracks().forEach(track => this._peer.addTrack(track, localStream));

    this._peer.onicecandidate = ({ candidate }) => {
      if (candidate) onIceCandidate(this.id, candidate)
    };

    this._peer.ontrack = ({ streams }) => {
      if (!this.remoteStream) this._emitter.emit('stream', this.remoteStream = streams[0]);
    };
  }
}