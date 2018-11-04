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

  _isConnected() {
    return this.localSdp && this.remoteSdp && this.remoteStream;
  }

  _setLocalStream(stream) {
    this.localStream = stream;
  }

  _setRemoteStream(stream) {
    this.remoteStream = stream;
  }

  _setDataChannel(channel) {
    this._dc = channel;
  }

  _setLocalSdp(sdp) {
    this.localSdp = sdp;
  }

  _setRemoteSdp(sdp) {
    this.remoteSdp = sdp;
  }

  _attachDataChannel() {
    this._dc.onmessage = ({ data }) => this._emitter.emit('message', data);
    this._dc.onclose = () => this._emitter.emit('close');
    this._dc.onopen = () => this._emitter.emit('open');
    this._dc.onerror = (error) => {
      if (!this._emitter.hasListeners(this._emitter, 'error')) throw error;
      this._emitter.emit('error', error);
    };
  }
}