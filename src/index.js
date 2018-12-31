import connect from './websocket';
import requestScreen from './requestScreen';
import getBrowserRTC from 'get-browser-rtc'

import Signal from './Signal';
import WebRTC from './WebRTC';

const CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const peerConnector = async ({ servers, mediaType, config = CONFIG }) => {
  if (!getBrowserRTC()) {
    throw new Error('Not support getUserMedia API');
  }

  mediaType = await normalizeMediaType(mediaType);
  const rtc =  new WebRTC(await navigator.mediaDevices.getUserMedia(mediaType));
  const signal = new Signal({ rtc, config, webSocket: await connect(servers) });
  signal.signaling()

  return rtc
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