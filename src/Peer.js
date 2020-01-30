import Emitter from 'event-emitter';
import allOff from 'event-emitter/all-off';
import nanoid from 'nanoid';

export const DEFAULT_CONFIG = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default class Peer {
    /**
     * @param {object} props
     * @param {string} [props.id]
     * @param {MediaStream} [props.stream]
     * @param {RTCConfiguration} [props.config]
     * @param {boolean} [props.channel]
     */
    constructor({ stream = false, id = nanoid(20), channel = true, config = DEFAULT_CONFIG } = {}) {
        this.id = id;
        this.localStream = stream;
        this.remoteStream = null;
        this.localSdp = null;
        this.remoteSdp = null;

        this._rtcPeer = new RTCPeerConnection(config);
        this._useDataChannel = channel;
        this._dataChannel = null;
        this._emitter = new Emitter();
        this._isConnectedPeer = false;
        this._isConnectedDataChannel = false;
        this._dataQueue = [];

        this._attachEvents();
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

    isConnected() {
        return this._useDataChannel ?
            this._isConnectedDataChannel && this._isConnectedPeer :
            this._isConnectedPeer;
    }

    getSenders() {
        return this._rtcPeer.getSenders();
    }

    async createOfferSdp(options) {
        this.localSdp = await this._rtcPeer.createOffer(options);
        this._rtcPeer.setLocalDescription(this.localSdp);
        return this.localSdp;
    }

    async createAnswerSdp(options) {
        this.localSdp = await this._rtcPeer.createAnswer(options);
        this._rtcPeer.setLocalDescription(this.localSdp);
        return this.localSdp;
    }

    createDataChannel(channelName, dataChannelDict) {
        if (!this._useDataChannel) return;
        if (!this._rtcPeer.createDataChannel) return;

        this._setDataChannel(this._rtcPeer.createDataChannel(channelName, dataChannelDict));
    }

    setRemoteDescription(sdp) {
        this.remoteSdp = sdp;
        return this._rtcPeer.setRemoteDescription(new RTCSessionDescription(this.remoteSdp));
    }

    addIceCandidate(candidate) {
        return this._rtcPeer.addIceCandidate(candidate);
    }

    send(data) {
        if (!this._useDataChannel || !this._dataChannel) return;
        if (this._dataChannel.readyState !== 'open') return;
        if (!this._rtcPeer.iceConnectionState !== 'connected') return;
        this._dataChannel.send(data);
    }

    close() {
        this.closePeer();
        this.closeChannel();
        this.destroy();
    }

    closePeer() {
        if (!this._rtcPeer.iceConnectionState === 'disconnected') return;
        this._rtcPeer.close();
    }

    closeChannel() {
        if (!this._dataChannel) return;
        if (this._dataChannel.readyState === 'closed') return;
        this._dataChannel.close();
    }

    destroy() {
        allOff(this._emitter);
    }

    _setDataChannel(dataChannel) {
        this._dataChannel = dataChannel;

        this._dataChannel.onopen = () => {
            this._isConnectedDataChannel = true;
            this._emitConnect();
        };

        this._dataChannel.onmessage = ({ data }) => {
            if (!this.isConnected()) {
                this._dataQueue.push(data);
                return;
            }

            this._emitter.emit('data', data);
        };

        this._dataChannel.onerror = (error) => {
            if (!this._emitter.hasListeners(this._emitter, 'error')) throw error;
            this._emitter.emit('error', error);
        };

        this._dataChannel.onclose = () => this._emitter.emit('close', 'datachannel');
    }

    _attachEvents() {
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
                this._rtcPeer.addTrack(track, this.localStream);
            });
        }

        this._rtcPeer.onicecandidate = ({ candidate }) => {
            if (candidate) this._emitter.emit('iceCandidate', candidate);
        };

        this._rtcPeer.ontrack = ({ streams }) => {
            if (this.remoteStream) return;
            const [stream] = streams;
            this._emitter.emit('stream', this.remoteStream = stream);
        };

        this._rtcPeer.ondatachannel = ({ channel }) => this._setDataChannel(channel);

        this._rtcPeer.oniceconnectionstatechange = () => {
            const state = this._rtcPeer.iceConnectionState;

            if (state === 'connected') {
                this._isConnectedPeer = true;
                this._emitConnect();
            }

            if (state === 'disconnected') {
                this._emitter.emit('close', 'ICE Connection');
            }

            this._emitter.emit('changeIceState', state);
        };
    }

    _emitConnect() {
        if (!this.isConnected()) return;
        this._emitter.emit('connect');

        for (const data of this._dataQueue) {
            this._emitter.emit('data', data);
        }
        this._dataQueue = [];
    }
}
