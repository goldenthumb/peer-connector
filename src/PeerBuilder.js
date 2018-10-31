export default class PeerBuilder {
  constructor(options) {
    this._id = options.id;
    this._localSdp = options.localSdp;
    this._remoteSdp = options.remoteSdp;
    this._localStream = options.localStream;
    this._remoteStream = options.remoteStream;
    this._emitter = options.emitter;
    this._dc = options.dc;
  }

  get id() {
    return this._id;
  }

  get localSdp() {
    return this._localSdp;
  }

  get remoteSdp() {
    return this._remoteSdp;
  }

  get localStream() {
    return this._localStream;
  }

  get remoteStream() {
    return this._remoteStream;
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  send(data) {
    this._dc.value && this._dc.value.send(data);
  }
}