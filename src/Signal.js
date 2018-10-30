import EventEmitter from 'event-emitter';
import randombytes from 'randombytes';

export const MESSAGE = {
  JOIN: '/PEER_CONNECTOR/join',
  REQUEST_CONNECT: '/PEER_CONNECTOR/request/peer-connect',
  SDP: '/PEER_CONNECTOR/sdp',
  CANDIDATE: '/PEER_CONNECTOR/candidate',
  DATA: '/PEER_CONNECTOR/data',
};

export default class Signal {
  constructor(webSocket) {
    this._emitter = new EventEmitter();
    this._ws = webSocket;
    this._ws.onmessage = this._onMessage.bind(this);
    this._id = randombytes(20).toString('hex');

    this._onMessage();
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  sendMessage(receiver, message) {
    this._send(MESSAGE.DATA, {
      receiver,
      sender: this._id,
      message
    })
  }

  join() {
    this._send(MESSAGE.JOIN, { sender: this._id });
  }

  requestPeer(receiver) {
    this._send(MESSAGE.REQUEST_CONNECT, {
      receiver,
      sender: this._id
    });
  }

  sendSdp(receiver, sdp) {
    this._send(MESSAGE.SDP, {
      receiver,
      sender: this._id,
      sdp
    });
  }

  sendCandidate(receiver, candidate) {
    this._send(MESSAGE.CANDIDATE, {
      receiver,
      sender: this._id,
      candidate
    });
  }

  _onMessage(message) {
    if (!message) return;
    const { event, data } = JSON.parse(message.data);

    if (this._equalId(data)) this._emitter.emit(event, data);
  }

  _send(event, data) {
    this._ws.send(JSON.stringify({ event, data }));
  }

  _equalId(data) {
    return !data.receiver || data.receiver === this._id
  }
}