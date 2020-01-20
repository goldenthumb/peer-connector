import EventEmitter from 'event-emitter';
import allOff from 'event-emitter/all-off';
import nanoid from 'nanoid';

export const SIGNAL_EVENT = {
    JOIN: 'join',
    REQUEST_CONNECT: 'request-connect',
    SDP: 'sdp',
    CANDIDATE: 'candidate',
};
export default class Signal {
    /**
     * @param {object} props
     * @param {WebSocket} props.websocket
     * @param {string} [props.id]
     */
    constructor({ websocket, id = nanoid(20) }) {
        this.id = id;
        this._emitter = new EventEmitter();
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

    autoSignal(peerConnector) {
        this.send(SIGNAL_EVENT.JOIN);

        this._emitter.on(SIGNAL_EVENT.JOIN, ({ sender }) => {
            this.send(SIGNAL_EVENT.REQUEST_CONNECT, { receiver: sender });
        });

        this._emitter.on(SIGNAL_EVENT.REQUEST_CONNECT, async ({ sender }) => {
            const peer = peerConnector.createPeer(sender);

            peer.createDataChannel(this.id);

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
                const peer = peerConnector.createPeer(sender);

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
