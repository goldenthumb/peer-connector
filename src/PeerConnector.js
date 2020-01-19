import getBrowserRTC from 'get-browser-rtc';
import Emitter from 'event-emitter';
import allOff from 'event-emitter/all-off';
import Peer from './Peer';

const DEFAULT_CONFIG = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default class PeerConnector {
    constructor({ stream, config = DEFAULT_CONFIG }) {
        if (!getBrowserRTC()) {
            throw new Error('Not support getUserMedia API');
        }

        this.stream = stream;
        this.peers = new Map();

        this._config = config;
        this._emitter = new Emitter();
    }

    on(eventName, listener) {
        this._emitter.on(eventName, listener);
    }

    off(eventName, listener) {
        this._emitter.off(eventName, listener);
    }

    createPeer(id) {
        const peer = new Peer({ id, stream: this.stream, config: this._config });

        peer.on('connect', () => this._emitter.emit('connect', peer));
        this.peers.set(peer.id, peer);

        return peer;
    }

    hasPeer(id) {
        return this.peers.has(id);
    }

    getPeer(id) {
        return this.peers.get(id);
    }

    close() {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
        }

        this.destroy();
    }

    destroy() {
        allOff(this._emitter);
    }
}
