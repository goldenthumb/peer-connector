import EventEmitter from 'event-emitter';
import randombytes from 'randombytes';

import { MESSAGE } from './constants';

export default class Signal {
    constructor({ webSocket, peerConnector }) {
        this._emitter = new EventEmitter();
        this._ws = webSocket;
        this._id = randombytes(20).toString('hex');
        this._pc = peerConnector;
        
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
        this._ws.send(JSON.stringify({ event, data: Object.assign({}, data, { sender: this._id }) }));
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
    
    _getPeerOrCreate(id) {
        return this._pc.hasPeer(id)
            ? this._pc.getPeer(id)
            : this._createPeer(id);
    }
    
    _createPeer(id) {
        return this._pc.createPeer({
            id,
            onIceCandidate: (candidate) => {
                this._send(MESSAGE.CANDIDATE, { receiver: id, candidate });
            }
        });
    }
}
