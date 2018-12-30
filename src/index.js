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
  const ws = await connect(servers);
  const signal = new Signal(ws);

  const rtc =  new WebRTC({ config, stream: await navigator.mediaDevices.getUserMedia(mediaType) });
  signal.signaling(rtc)

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