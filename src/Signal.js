import EventEmitter from 'event-emitter';
import randombytes from 'randombytes';

export const SIGNAL_EVENT = {
    JOIN: 'join',
    REQUEST_CONNECT: 'request-connect',
    SDP: 'sdp',
    CANDIDATE: 'candidate',
};
export default class Signal {
    constructor({ websocket, id = randombytes(20).toString('hex') }) {
        this._emitter = new EventEmitter();
        this._ws = websocket;
        this._id = id;

        websocket.onmessage = this._onMessage.bind(this);
    }

    send(event, data = {}) {
        this._ws.send(JSON.stringify({
            event,
            data: {
                sender: this._id,
                ...data,
            },
        }));
    }

    autoSignaling(peerConnector) {
        this.send(SIGNAL_EVENT.JOIN);

        this._emitter.on(SIGNAL_EVENT.JOIN, ({ sender }) => {
            this.send(SIGNAL_EVENT.REQUEST_CONNECT, { receiver: sender });
        });

        this._emitter.on(SIGNAL_EVENT.REQUEST_CONNECT, async ({ sender }) => {
            const peer = peerConnector.createPeer(sender);

            peer.on('onIceCandidate', (candidate) => {
                this.send(SIGNAL_EVENT.CANDIDATE, { receiver: peer.id, candidate });
            });

            peer.createDataChannel(this._id);
            this.send(SIGNAL_EVENT.SDP, { receiver: peer.id, sdp: await peer.createOfferSdp() });
        });

        this._emitter.on(SIGNAL_EVENT.SDP, async ({ sender, sdp }) => {
            if (sdp.type === 'answer') {
                const peer = peerConnector.getPeer(sender);
                await peer.setRemoteDescription(sdp);
            } else {
                const peer = peerConnector.createPeer(sender);

                peer.on('onIceCandidate', (candidate) => {
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

    _onMessage({ data: message } = {}) {
        const { event, data } = JSON.parse(message);
        if (!this._equalId(data)) return;

        this._emitter.emit(event, data);
        this._emitter.emit('message', { event, data });
    }

    _equalId(data) {
        return !data.receiver || data.receiver === this._id;
    }
}
