import Emitter from 'event-emitter';

export default class Peer {
  constructor({id, peerConnection, localStream, onIceCandidate}) {
    this._id = id;
    this._pc = peerConnection;
    this._dc = null;
    this._emitter = new Emitter();
    this._localSdp = null;
    this._remoteSdp = null;
    this._remoteStream = null;
    this._localStream = localStream;
    this._onIceCandidate = onIceCandidate

    this._init()
  }

  get id(){
    return this._id
  }

  get localStream(){
    return this._localStream
  }

  get remoteStream(){
    return this._remoteStream
  }

  get localSdp(){
    return this._localSdp
  }

  get remoteSdp(){
    return this._remoteSdp
  }

  createDataChannel(channelName) {
    if (!this._pc.createDataChannel) return;
    this._setDataChannel(this._pc.createDataChannel(channelName))
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
      if (candidate) this._onIceCandidate(this.id, candidate)
    };

    this._pc.ontrack = ({ streams }) => {
      if (!this._remoteStream) this._emitter.emit('stream', this._remoteStream = streams[0]);
    };

    this._pc.ondatachannel = ({ channel }) => this._setDataChannel(channel);
  }

  async createOfferSdp() {
    const sdp = this._localSdp = await this._pc.createOffer();
    this._pc.setLocalDescription(sdp);
    return sdp
  }

  async createAnswerSdp(){
    const sdp = this._localSdp = await this._pc.createAnswer();
    this._pc.setLocalDescription(sdp);
    return sdp
  }
}