import Emitter from 'event-emitter';
import randombytes from 'randombytes';

import Peer from './Peer';
import { MESSAGE } from './Signal';

export default class WebRTC {
  constructor({ stream, config }) {
    this._emitter = new Emitter();
    this._channelName = randombytes(20).toString('hex');
    this._peers = new Map();
    this._stream = stream;
    this._config = config;
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

  _getPeerOrNew(id) {
    return this._peers.get(id) || this._newPeer(id);
  }

  _newPeer(id) {
    const peer = new Peer({
      id, 
      peerConnection: new RTCPeerConnection(this._config), 
      localStream: this.stream, 
    });

    this._peers.set(id, peer);
    return peer;
  }
}