import _ from 'lodash';

export default class PeerBuilder {
  constructor(options) {
    this.id = options.id;
    this.localSdp = options.localSdp;
    this.remoteSdp = options.remoteSdp;
    this.localStream = options.localStream;
    this.remoteStream = options.remoteStream;
    this._emitter = options.emitter;
    this._dc = options.dc;
    this._signal = options.signal;
    this._messageBuffer = options.messageBuffer;
    this._scheduleBufferFlush = null;
  }

  on(eventName, listener) {
    if (this._messageBuffer.length && eventName === 'message') {
      this._messageBuffer.forEach(message => listener(message));

      if (!this._scheduleBufferFlush) {
        this._scheduleBufferFlush = _.defer(()=> {
          this._messageBuffer = [];
          this._scheduleBufferFlush = null;
        })
      }
    }

    this._emitter.on(eventName, listener);
  }

  sendBuffer(data) {
    this._dc.value && this._dc.value.send(data);
  }

  sendMessage(data) {
    this._signal.sendMessage(this.id, data);
  }
}