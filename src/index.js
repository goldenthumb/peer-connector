import connect from './websocket';
import requestScreen from './requestScreen';
import getBrowserRTC from 'get-browser-rtc';

import Signal from './Signal';
import PeerConnector from './PeerConnector';

export default async ({ servers, mediaType, config }) => {
  if (!getBrowserRTC()) {
    throw new Error('Not support getUserMedia API');
  }

  const stream = await (mediaType && mediaType.screen ? getDisplayMedia() : getUserMedia(mediaType));
  const peerConnector = new PeerConnector({ stream, config });

  if (servers) {
    const signal = new Signal({ peerConnector, config, webSocket: await connect(servers) });
    signal.signaling();
  }
  
  return peerConnector;
};

const getDisplayMedia = () => {
  if (navigator.getDisplayMedia) {
    return navigator.getDisplayMedia({ video: true });
  } else if (navigator.mediaDevices.getDisplayMedia) {
    return navigator.mediaDevices.getDisplayMedia({ video: true });
  } else {
    return navigator.mediaDevices.getUserMedia({ video: requestScreen() });
  }
};

const getUserMedia = (mediaType) => {
  if (!mediaType) return false;

  return navigator.mediaDevices.getUserMedia({
    video: mediaType.video,
    audio: mediaType.audio
  });
};