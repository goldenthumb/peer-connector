import getBrowserRTC from 'get-browser-rtc';
import connect from './websocket';
import requestScreen from './requestScreen';

import Signal from './Signal';
import PeerConnector from './PeerConnector';

export default async ({ servers, mediaType, stream, config }) => {
    if (!getBrowserRTC()) {
        throw new Error('Not support getUserMedia API');
    }

    if (!stream && mediaType) {
        stream = await getMediaStream(mediaType);
    }

    const peerConnector = new PeerConnector({ stream, config });

    if (servers) {
        const signal = new Signal({ peerConnector, config, webSocket: await connect(servers) });
        signal.signaling();
    }

    return peerConnector;
};

export const getMediaStream = (mediaType = {}) => (mediaType.screen ? getDisplayMedia() : getUserMedia(mediaType));

const getDisplayMedia = () => {
    if (navigator.getDisplayMedia) {
        return navigator.getDisplayMedia({ video: true });
    } if (navigator.mediaDevices.getDisplayMedia) {
        return navigator.mediaDevices.getDisplayMedia({ video: true });
    }
    return navigator.mediaDevices.getUserMedia({ video: requestScreen() });
};

const getUserMedia = ({ video, audio }) => {
    if (!video && !audio) return null;
    return navigator.mediaDevices.getUserMedia({ video, audio });
};
