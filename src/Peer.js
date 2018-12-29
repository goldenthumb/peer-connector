import Emitter from 'event-emitter';

export default class Peer {
  constructor({id, peerConnection, localStream, onIceCandidate}) {
    this._id = id;
    this._pc = peerConnection;
    this._dc = null;
    this._emitter = new Emitter();
    this.localSdp = null;
    this.remoteSdp = null;
    this.remoteStream = null;
    this._localStream = localStream;
    this._onIceCandidate = onIceCandidate

    this._attachEvents()
  }

  get id(){
    return this._id
  }

  get localStream(){
    return this._localStream
  }

  set onDataChannel(func) {
    this._pc.ondatachannel = func;
  }

  createOffer() {
    return this._pc.createOffer();
  }

  createAnswer() {
    return this._pc.createAnswer();
  }

  createDataChannel(channelName) {
    if (!this._pc.createDataChannel) return;
    return this._pc.createDataChannel(channelName);
  }

  setLocalDescription(sdp) {
    return this._pc.setLocalDescription(sdp);
  }

  setRemoteDescription(sdp) {
    return this._pc.setRemoteDescription(new RTCSessionDescription(sdp));
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

  _attachEvents() {
    const localStream = this.localStream;
    localStream.getTracks().forEach(track => this._pc.addTrack(track, localStream));

    this._pc.onicecandidate = ({ candidate }) => {
      if (candidate) this._onIceCandidate(this.id, candidate)
    };

    this._pc.ontrack = ({ streams }) => {
      if (!this.remoteStream) this._emitter.emit('stream', this.remoteStream = streams[0]);
    };
  }
}