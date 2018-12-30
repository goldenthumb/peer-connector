import EventEmitter from 'event-emitter';
import randombytes from 'randombytes';
import Peer from './Peer';

export const MESSAGE = {
  JOIN: '/PEER_CONNECTOR/join',
  REQUEST_CONNECT: '/PEER_CONNECTOR/request/peer-connect',
  SDP: '/PEER_CONNECTOR/sdp',
  CANDIDATE: '/PEER_CONNECTOR/candidate'
};

export default class Signal {
  constructor({ webSocket, config, rtc }) {
    this._emitter = new EventEmitter();
    this._ws = webSocket;
    this._id = randombytes(20).toString('hex');
    this._channelName = randombytes(20).toString('hex');
    this._rtc = rtc
    this._config = config;

    webSocket.onmessage = this._onMessage.bind(this);
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
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
  
  signaling() {
    this.join();

    this.on(MESSAGE.JOIN, ({ sender }) => {
      this.requestPeer(sender);
    });

    this.on(MESSAGE.REQUEST_CONNECT, async ({ sender }) => {
      const peer = this._createPeer(sender);
      peer.createDataChannel(this._channelName);
      this.sendSdp(peer.id, await peer.createOfferSdp());
    });

    this.on(MESSAGE.SDP, async ({ sender, sdp }) => {
      const peer = this._getPeerOrCreate(sender);      
      await peer.setRemoteDescription(sdp);

      if (sdp.type === 'offer'){
        this.sendSdp(peer.id, await peer.createAnswerSdp());
      }
    });

    this.on(MESSAGE.CANDIDATE, ({ sender, candidate }) => {
      const peer = this._getPeerOrCreate(sender);
      peer.addIceCandidate(candidate);
    });
  }

  _createPeer(peerId) {
    const peer = new Peer({
      id: peerId, 
      peerConnection: new RTCPeerConnection(this._config), 
      localStream: this._rtc.stream, 
    });

    peer.on('onIceCandidate', candidate => this.sendCandidate(peerId, candidate))
    this._rtc.addNewPeer(peer)
    
    return peer
  }

  _getPeerOrCreate(peerId){
    const peers = this._rtc.peers
    return peers.has(peerId) ? peers.get(peerId) : this._createPeer(peerId)
  }
}