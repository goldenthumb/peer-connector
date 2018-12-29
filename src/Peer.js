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
 
  set onIceCandidate(func) {
    this._peer.onicecandidate = func;
  }

  set onTrack(func) {
    this._peer.ontrack = func;
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

  addTrack(stream) {
    if (!stream) return;

    stream.getTracks().forEach(track => {
      this._peer.addTrack(track, stream);
    });
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

  _setLocalStream(stream) {
    this.localStream = stream;
  }

  _setRemoteStream(stream) {
    if (this.remoteStream) return;

    this.remoteStream = stream;
    this._emitter.emit('stream', stream);
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
}