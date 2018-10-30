import connect from './websocket';
import requestScreen from './requestScreen';

import Signal from './Signal';
import WebRTC from './WebRTC';

const peerConnector = async ({ servers, mediaType }) => {
  mediaType = await normalizeMediaType(mediaType);

  const ws = await connect(servers);
  const signal = new Signal(ws);
  const rtc = new WebRTC({ signal, mediaType });

  return rtc._init();
};

const normalizeMediaType = async (mediaType) => {
  mediaType = Object.assign({ video: true, audio: true }, mediaType);

  if (mediaType.screen) {
    mediaType.video = await requestScreen();
    mediaType.audio = false;
    delete mediaType.screen;
  }

  return mediaType;
};

export default peerConnector;