import EventEmitter from 'event-emitter';
import randombytes from 'randombytes';
import Peer from './Peer';
import { CONFIG, MESSAGE } from './constants';

export default class Signal {
  constructor({ webSocket, config, rtc }) {
    this._emitter = new EventEmitter();
    this._ws = webSocket;
    this._id = randombytes(20).toString('hex');
    this._rtc = rtc;
    this._config = Object.assign(CONFIG, config);

    webSocket.onmessage = this._onMessage.bind(this);
  }

  _on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  _onMessage(message) {
    if (!message) return;
    const { event, data } = JSON.parse(message.data);
    if (this._equalId(data)) this._emitter.emit(event, data);
  }

  _send(event, data = {}) {
    this._ws.send(JSON.stringify({ event, data: { ...data, sender: this._id } }));
  }

  _equalId(data) {
    return !data.receiver || data.receiver === this._id;
  }

  signaling() {
    this._send(MESSAGE.JOIN);

    this._on(MESSAGE.JOIN, ({ sender }) => {
      this._send(MESSAGE.REQUEST_CONNECT, { receiver: sender });
    });

    this._on(MESSAGE.REQUEST_CONNECT, async ({ sender }) => {
      const peer = this._createPeer(sender);
      peer.createDataChannel(this._id);
      this._send(MESSAGE.SDP, { receiver: peer.id, sdp: await peer.createOfferSdp() });
    });

    this._on(MESSAGE.SDP, async ({ sender, sdp }) => {
      const peer = this._getPeerOrCreate(sender);
      await peer.setRemoteDescription(sdp);

      if (sdp.type === 'offer') {
        this._send(MESSAGE.SDP, { receiver: peer.id, sdp: await peer.createAnswerSdp() });
      }
    });

    this._on(MESSAGE.CANDIDATE, ({ sender, candidate }) => {
      const peer = this._getPeerOrCreate(sender);
      peer.addIceCandidate(candidate);
    });
  }

  _createPeer(peerId) {
    const peer = new Peer({
      id: peerId,
      config: this._config,
      localStream: this._rtc.stream,
    });

    peer.on('onIceCandidate', candidate => this._send(MESSAGE.CANDIDATE, { receiver: peer.id, candidate }));
    this._rtc.addPeer(peer);

    return peer;
  }

  _getPeerOrCreate(peerId) {
    const peers = this._rtc.peers;
    return peers.has(peerId) ? peers.get(peerId) : this._createPeer(peerId);
  }
}