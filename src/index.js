import connect from './websocket';
import requestScreen from './requestScreen';
import getBrowserRTC from 'get-browser-rtc'

import Signal from './Signal';
import WebRTC from './WebRTC';

const peerConnector = async ({ servers, mediaType, config }) => {
  if (!getBrowserRTC()) {
    throw new Error('Not support getUserMedia API');
  }

  const stream = await (mediaType.screen ? getDisplayMedia() : getUserMedia(mediaType));
  const rtc = new WebRTC(stream);
  const signal = new Signal({ rtc, config, webSocket: await connect(servers) });
  signal.signaling();

  return rtc;
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
  return navigator.mediaDevices.getUserMedia({
    video: mediaType.video || true,
    audio: mediaType.audio || true
  });
};

export default peerConnector;