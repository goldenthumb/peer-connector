interface PeerProps {
    id?: string;
    stream?: MediaStream;
    config?: RTCConfiguration;
}

interface PeerConnectorProps {
    stream?: MediaStream;
    config?: RTCConfiguration;
    channel?: boolean;
    channelName?: string;
    channelConfig?: RTCDataChannelInit;
}

interface SignalProps {
    websocket: WebSocket;
    id?: string;
}

interface SignalProps {
    websocket: WebSocket;
    id?: string;
}

interface SignalEvent {
    VIEWER: 'viewer',
    HOST: 'host',
    MQTT: 'mqtt',
    RELAY: 'relay',
}

interface StreamConstraints {
    screen?: boolean;
    video?: boolean | MediaTrackConstraints;
    audio?: boolean | MediaTrackConstraints;
}

declare class Peer {
    constructor(props: PeerProps);
    on(eventName: string, listener: (props: any) => void): void;
    once(eventName: string, listener: (props: any) => void): void;
    off(eventName: string, listener: (props: any) => void): void;
    isConnected(): boolean;
    getSenders(): RTCRtpSender[];
    createOfferSdp(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    createAnswerSdp(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    createDataChannel(channelName: string, dataChannelDict?: RTCDataChannelInit): void;
    setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidateInit | RTCIceCandidate): Promise<void>;
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
    close(): void;
    destroy(): void;
}

declare class PeerConnector {
    constructor(props: PeerConnectorProps);
    on(eventName: string, listener: (props: any) => void): void;
    once(eventName: string, listener: (props: any) => void): void;
    off(eventName: string, listener: (props: any) => void): void;
    addPeer(peer: Peer): void;
    removePeer(id: string): Peer;
    hasPeer(id: string): Peer;
    getPeer(id: string): Peer;
    close(): void;
    destroy(): void;
}

declare class Signal {
    constructor(props: SignalProps);
    on(eventName: string, listener: (props: any) => void): void;
    once(eventName: string, listener: (props: any) => void): void;
    off(eventName: string, listener: (props: any) => void): void;
    send(event: string, data: object): void;
    autoSignal(peerConnector: PeerConnector): void;
    destroy(): void;
}

declare const peerConnector: {
    default: { new (props: PeerConnectorProps): PeerConnector };
    PeerConnector: { new (props: PeerConnectorProps): PeerConnector };
    Peer: { new (props: PeerProps): Peer };
    Signal: { new (props: SignalProps): Signal };
    SIGNAL_EVENT: SignalEvent;
    getMediaStream(props: StreamConstraints): Promise<MediaStream>
    connectWebsocket(url: string, protocols: string | string[]): Promise<WebSocket>;
}

export = peerConnector;