import Emitter from 'event-emitter';
import allOff from 'event-emitter/all-off';
import randombytes from 'randombytes';
import { CONFIG } from './constants';

export default class Peer {
    constructor({ localStream, id = randombytes(20).toString('hex'), config = CONFIG, data = {} }) {
        this._id = id;
        this._pc = new RTCPeerConnection(config);
        this._dc = null;
        this._emitter = new Emitter();
        this._localSdp = null;
        this._remoteSdp = null;
        this._remoteStream = null;
        this._localStream = localStream;
        this._isConnected = false;
        this._data = data;

        this._init();
    }

    get id() {
        return this._id;
    }

    get data() {
        return this._data;
    }

    get localStream() {
        return this._localStream;
    }

    get remoteStream() {
        return this._remoteStream;
    }

    get localSdp() {
        return this._localSdp;
    }

    get remoteSdp() {
        return this._remoteSdp;
    }

    get senders() {
        return this._pc.getSenders();
    }

    createDataChannel(channelName) {
        if (!this._pc.createDataChannel) return;
        this._setDataChannel(this._pc.createDataChannel(channelName));
    }

    setRemoteDescription(sdp) {
        this._remoteSdp = sdp;
        return this._pc.setRemoteDescription(new RTCSessionDescription(this._remoteSdp));
    }

    addIceCandidate(candidate) {
        return this._pc.addIceCandidate(candidate);
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
        this._pc.close();
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
            this.localStream.getTracks().forEach((track) => this._pc.addTrack(track, this.localStream));
        }

        this._pc.onicecandidate = ({ candidate }) => {
            if (candidate) this._emitter.emit('onIceCandidate', candidate);
        };

        this._pc.ontrack = ({ streams }) => {
            const [stream] = streams;
            this._remoteStream = stream;
            if (!this._remoteStream) this._emitter.emit('stream', this._remoteStream);
        };

        this._pc.ondatachannel = ({ channel }) => this._setDataChannel(channel);

        this._pc.oniceconnectionstatechange = () => {
            if (!this._isConnected && this._pc.iceConnectionState === 'connected') {
                this._isConnected = true;
                this._emitter.emit('connect');
            }

            if (this._pc.iceConnectionState === 'disconnected') {
                this._isConnected = false;
                this._emitter.emit('close', 'ICE connection');
            }

            this._emitter.emit('updateIceState', this._pc.iceConnectionState);
        };
    }

    async createOfferSdp() {
        this._localSdp = await this._pc.createOffer();
        this._pc.setLocalDescription(this._localSdp);
        return this._localSdp;
    }

    async createAnswerSdp() {
        this._localSdp = await this._pc.createAnswer();
        this._pc.setLocalDescription(this._localSdp);
        return this._localSdp;
    }
}
