import getBrowserRTC from 'get-browser-rtc';
import Emitter from 'event-emitter';
import allOff from 'event-emitter/all-off';
import Peer from './Peer';

export const DEFAULT_CONFIG = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export const DEFAULT_OPTION = {
    dataChannel: true,
};

export default class PeerConnector {
    /**
     * @param {object} props
     * @param {MediaStream} [props.stream]
     * @param {RTCConfiguration} [props.config]
     * @param {DEFAULT_OPTION} [props.option]
     */
    constructor({ stream, config = DEFAULT_CONFIG, option = DEFAULT_OPTION }) {
        if (!getBrowserRTC()) {
            throw new Error('Not support getUserMedia API');
        }

        this.stream = stream;
        this.peers = new Map();

        this._config = config;
        this._option = option;
        this._emitter = new Emitter();
    }

    on(eventName, listener) {
        this._emitter.on(eventName, listener);
    }

    once(eventName, listener) {
        this._emitter.once(eventName, listener);
    }

    off(eventName, listener) {
        this._emitter.off(eventName, listener);
    }

    createPeer(id) {
        const peer = new Peer({ id, stream: this.stream, config: this._config, option: this._option });

        peer.once('connect', () => this._emitter.emit('connect', peer));
        this.setPeer(peer);

        return peer;
    }

    hasPeer(id) {
        return this.peers.has(id);
    }

    getPeer(id) {
        return this.peers.get(id);
    }

    setPeer(peer) {
        this.peers.set(peer.id, peer);
    }

    removePeer(id) {
        return this.peers.delete(id);
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
