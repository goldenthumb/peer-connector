import Emitter from 'event-emitter';

export default class WebRTC {
  constructor(stream) {
    this._emitter = new Emitter();
    this._peers = new Map();
    this._stream = stream
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

  addNewPeer(peer){
    this.peers.set(peer.id, peer)
    peer.on('connect', () => this._emitter.emit('connect', peer))
  }
}