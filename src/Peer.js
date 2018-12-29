import Emitter from 'event-emitter';

export default class Peer {
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