import Emitter from 'event-emitter';
import allOff from 'event-emitter/all-off';
import randombytes from 'randombytes';

export default class Peer {
    constructor({ stream, config, data, id = randombytes(20).toString('hex') }) {
        this.id = id;
        this.data = data;
        this.pc = new RTCPeerConnection(config);
        this.localStream = stream;
        this.remoteStream = null;
        this.localSdp = null;
        this.remoteSdp = null;

        this._dc = null;
        this._emitter = new Emitter();
        this._isConnected = false;

        this._init();
    }

    getSenders() {
        return this.pc.getSenders();
    }

    createDataChannel(channelName) {
        if (!this.pc.createDataChannel) return;
        this._setDataChannel(this.pc.createDataChannel(channelName));
    }

    setRemoteDescription(sdp) {
        this.remoteSdp = sdp;
        return this.pc.setRemoteDescription(new RTCSessionDescription(this.remoteSdp));
    }

    addIceCandidate(candidate) {
        return this.pc.addIceCandidate(candidate);
    }

    on(eventName, listener) {
        this._emitter.on(eventName, listener);
    }

    once(eventName, listener) {
        this._emitter.once(eventName, listener);
    }

    send(data) {
        if (this._dc) this._dc.send(data);
    }

    close() {
        this.pc.close();
        allOff(this._emitter);
    }

    _setDataChannel(dc) {
        this._dc = dc;

        dc.onmessage = ({ data }) => this._emitter.emit('data', data);
        dc.onclose = () => this._emitter.emit('close', 'datachannel');
        dc.onopen = () => this._emitter.emit('open');
        dc.onerror = (error) => {
            if (!this._emitter.hasListeners(this._emitter, 'error')) throw error;
            this._emitter.emit('error', error);
        };
    }

    _init() {
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => this.pc.addTrack(track, this.localStream));
        }

        this.pc.onicecandidate = ({ candidate }) => {
            if (candidate) this._emitter.emit('onIceCandidate', candidate);
        };

        this.pc.ontrack = ({ streams }) => {
            const [stream] = streams;
            this.remoteStream = stream;
            if (!this.remoteStream) this._emitter.emit('stream', this.remoteStream);
        };

        this.pc.ondatachannel = ({ channel }) => this._setDataChannel(channel);

        this.pc.oniceconnectionstatechange = () => {
            if (!this._isConnected && this.pc.iceConnectionState === 'connected') {
                this._isConnected = true;
                this._emitter.emit('connect');
            }

            if (this.pc.iceConnectionState === 'disconnected') {
                this._isConnected = false;
                this._emitter.emit('close', 'ICE connection');
            }

            this._emitter.emit('updateIceState', this.pc.iceConnectionState);
        };
    }

    async createOfferSdp() {
        this.localSdp = await this.pc.createOffer();
        this.pc.setLocalDescription(this.localSdp);
        return this.localSdp;
    }

    async createAnswerSdp() {
        this.localSdp = await this.pc.createAnswer();
        this.pc.setLocalDescription(this.localSdp);
        return this.localSdp;
    }
}
