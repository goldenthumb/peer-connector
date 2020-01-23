import Emitter from 'event-emitter';
import allOff from 'event-emitter/all-off';
import nanoid from 'nanoid';
import { detect } from 'detect-browser';

class PeerConnector {
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

const DEFAULT_CONFIG = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

class Peer {
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
        this._dataChannel.send(data);
    }

    close() {
        this._rtcPeer.close();
        this.destroy();
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
                this._emitter.emit('close', state);
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

const SIGNAL_EVENT = {
    JOIN: 'join',
    REQUEST_CONNECT: 'requestConnect',
    SDP: 'sdp',
    CANDIDATE: 'candidate',
};
class Signal {
    /**
     * @param {object} props
     * @param {WebSocket} props.websocket
     * @param {string} [props.id]
     */
    constructor({ websocket, id = nanoid(20) }) {
        this.id = id;
        this._emitter = new Emitter();
        this._ws = websocket;

        websocket.onmessage = this._onMessage.bind(this);
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

    send(event, data = {}) {
        this._ws.send(JSON.stringify({
            event,
            data: {
                sender: this.id,
                ...data,
            },
        }));
    }

    /** @param {import('./PeerConnector').default} peerConnector */
    autoSignal(peerConnector) {
        this.send(SIGNAL_EVENT.JOIN);

        this._emitter.on(SIGNAL_EVENT.JOIN, ({ sender }) => {
            this.send(SIGNAL_EVENT.REQUEST_CONNECT, { receiver: sender });
        });

        this._emitter.on(SIGNAL_EVENT.REQUEST_CONNECT, async ({ sender }) => {
            const { stream, config, channel, channelName, channelConfig } = peerConnector;
            const peer = new Peer({ id: sender, stream, config, channel });
            peerConnector.addPeer(peer);

            peer.createDataChannel(channelName, channelConfig);

            peer.on('iceCandidate', (candidate) => {
                this.send(SIGNAL_EVENT.CANDIDATE, { receiver: peer.id, candidate });
            });

            this.send(SIGNAL_EVENT.SDP, { receiver: peer.id, sdp: await peer.createOfferSdp() });
        });

        this._emitter.on(SIGNAL_EVENT.SDP, async ({ sender, sdp }) => {
            if (sdp.type === 'answer') {
                const peer = peerConnector.getPeer(sender);
                await peer.setRemoteDescription(sdp);
            } else {
                const { stream, config, channel } = peerConnector;
                const peer = new Peer({ id: sender, stream, config, channel });
                peerConnector.addPeer(peer);

                peer.on('iceCandidate', (candidate) => {
                    this.send(SIGNAL_EVENT.CANDIDATE, { receiver: peer.id, candidate });
                });

                await peer.setRemoteDescription(sdp);
                this.send(SIGNAL_EVENT.SDP, { receiver: peer.id, sdp: await peer.createAnswerSdp() });
            }
        });

        this._emitter.on(SIGNAL_EVENT.CANDIDATE, ({ sender, candidate }) => {
            const peer = peerConnector.getPeer(sender);
            peer.addIceCandidate(candidate);
        });
    }

    destroy() {
        allOff(this._emitter);
    }

    _onMessage({ data: message } = {}) {
        const { event, data } = JSON.parse(message);
        if (!this._equalId(data)) return;

        this._emitter.emit(event, data);
        this._emitter.emit('message', { event, data });
    }

    _equalId(data) {
        return !data.receiver || data.receiver === this.id;
    }
}

const EXTENSION_ID = 'mopiaiibclcaiolndiidmkpejmcpjmcf';
const EXTENSION_URL = `https://chrome.google.com/webstore/detail/screen-sharing-extension/${EXTENSION_ID}`;

async function requestScreen() {
    switch (detect().name) {
    case 'firefox':
        return { mediaSource: 'screen' };
    case 'chrome':
        if (!await isInstalledExtension()) {
            window.location.href = EXTENSION_URL;
        }

        return {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: await getStreamId(),
                maxWidth: window.screen.width,
                maxHeight: window.screen.height,
            },
        };
    default:
        throw new Error('not support browser');
    }
}

function getStreamId() {
    return new Promise((resolve) => {
        window.postMessage({ type: 'SCREEN_REQUEST', text: 'start' }, '*');
        window.addEventListener('message', function listener({ data: { type, streamId } }) {
            if (type === 'SCREEN_SHARE') {
                window.removeEventListener('message', listener);
                resolve(streamId);
            }

            if (type === 'SCREEN_CANCEL') {
                window.removeEventListener('message', listener);
                resolve(false);
            }
        });
    });
}

function isInstalledExtension() {
    return new Promise((resolve) => {
        const img = document.createElement('img');
        img.src = `chrome-extension://${EXTENSION_ID}/icon.png`;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
    });
}

/**
 * @param {{ screen: boolean } & MediaStreamConstraints} args
 * @param {ReturnType<MediaStream>}
*/
function getMediaStream({ screen, video, audio } = {}) {
    return screen ?
        getDisplayMedia() :
        navigator.mediaDevices.getUserMedia({ video, audio });
}

function getDisplayMedia() {
    if (navigator.getDisplayMedia) {
        return navigator.getDisplayMedia({ video: true });
    }

    if (navigator.mediaDevices.getDisplayMedia) {
        return navigator.mediaDevices.getDisplayMedia({ video: true });
    }

    return navigator.mediaDevices.getUserMedia({ video: requestScreen() });
}

/**
 * @param {string} url
 * @param {string | string[]} protocols
 */
function connectWebsocket(url, protocols) {
    return new Promise((resolve, reject) => {
        const webSocket = new WebSocket(url, protocols);

        webSocket.onopen = () => resolve(webSocket);
        webSocket.onerror = () => reject(new Error('connect failed.'));
    });
}

export default PeerConnector;
export { PeerConnector, Peer, Signal, SIGNAL_EVENT, getMediaStream, connectWebsocket };
