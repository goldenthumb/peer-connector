import Emitter from 'event-emitter';
import Peer from './Peer';

export default class PeerConnector {
    constructor({ stream, config }) {
        this._emitter = new Emitter();
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

    createPeer({ id, onIceCandidate, data }) {
        const peer = new Peer({ id, localStream: this._stream, config: this._config, data });

        peer.on('onIceCandidate', onIceCandidate);
        peer.on('connect', () => this._emitter.emit('connect', peer));

        this._peers.set(peer.id, peer);

        return peer;
    }

    hasPeer(id) {
        return this._peers.has(id);
    }

    getPeer(id) {
        return this._peers.get(id);
    }

    close() {
        if (this._stream) {
            this._stream.getTracks().forEach((track) => track.stop());
        }
    }
}
