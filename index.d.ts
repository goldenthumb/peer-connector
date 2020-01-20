interface Option {
    dataChannel: boolean;
}

interface PeerProps {
    stream?: MediaStream;
    config?: RTCConfiguration;
    option?: Option;
    id?: string;
}

interface PeerConnectorProps {
    stream?: MediaStream;
    config?: RTCConfiguration;
    option?: Option;
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
    video?: boolean;
    audio?: boolean;
}

declare class Peer {
    constructor({ stream, config, id }: PeerProps);
    on(eventName: string, listener: (props: any) => void): void;
    once(eventName: string, listener: (props: any) => void): void;
    off(eventName: string, listener: (props: any) => void): void;
    isConnected(): boolean;
    getSenders(): RTCRtpSender[];
    createOfferSdp(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    createAnswerSdp(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    createDataChannel(channelName: string): void;
    setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidateInit | RTCIceCandidate): Promise<void>;
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
    close(): void;
    destroy(): void;
}

declare class PeerConnector {
    constructor({ stream, config, option }: PeerConnectorProps);
    on(eventName: string, listener: (props: any) => void): void;
    once(eventName: string, listener: (props: any) => void): void;
    off(eventName: string, listener: (props: any) => void): void;
    createPeer(id: string): Promise<Peer>;
    hasPeer(id: string): Peer;
    getPeer(id: string): Peer;
    setPeer(peer: Peer): void;
    removePeer(id: string): Peer;
    close(): void;
    destroy(): void;
}

declare class Signal {
    constructor({ websocket, id }: SignalProps);
    on(eventName: string, listener: (props: any) => void): void;
    once(eventName: string, listener: (props: any) => void): void;
    off(eventName: string, listener: (props: any) => void): void;
    send(event: string, data: object): void;
    autoSignal(peerConnector: PeerConnector): void;
    destroy(): void;
}

declare const peerConnector: {
    default: PeerConnector;
    Signal: Signal;
    SIGNAL_EVENT: SignalEvent;
    getMediaStream({ screen, video, audio }: StreamConstraints): Promise<MediaStream>
    connectWebsocket(url: string, protocols: string | string[]): Promise<WebSocket>;
}

export = peerConnector;