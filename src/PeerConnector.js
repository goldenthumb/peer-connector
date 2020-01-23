import Emitter from 'event-emitter';
import allOff from 'event-emitter/all-off';
import nanoid from 'nanoid';

export default class PeerConnector {
    /**
     * @param {object} [props]
     * @param {MediaStream} [props.stream]
     * @param {RTCConfiguration} [props.config]
     * @param {boolean} [props.channel]
     * @param {string} [props.channelName]
     * @param {RTCDataChannelInit} [props.channelConfig]
     */
    constructor({ stream = false, config, channel = true, channelName = nanoid(20), channelConfig = {} } = {}) {
        this.stream = stream;
        this.peers = new Map();
        this.config = config;
        this.channel = channel;
        this.channelName = channelName;
        this.channelConfig = channelConfig;

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

    addPeer(peer) {
        peer.once('connect', () => this._emitter.emit('connect', peer));
        this.peers.set(peer.id, peer);
        return peer;
    }

    removePeer(id) {
        return this.peers.delete(id);
    }

    hasPeer(id) {
        return this.peers.has(id);
    }

    getPeer(id) {
        return this.peers.get(id);
    }

    close(stream = this.stream) {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }

        this.destroy();
    }

    destroy() {
        allOff(this._emitter);
    }
}
