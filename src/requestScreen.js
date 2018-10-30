import { detect } from 'detect-browser';
const userAgent = detect();

const EXTENSION_ID = 'mopiaiibclcaiolndiidmkpejmcpjmcf';
const EXTENSION_URL = `https://chrome.google.com/webstore/detail/screen-sharing-extension/${EXTENSION_ID}`;

export default async () => {
  if (!isSupport()) {
    throw new Error('not support browser');
  }

  if (userAgent.name === 'firefox') {
    return { mediaSource: 'screen' };
  }

  if (userAgent.name === 'chrome') {
    return {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: await getStreamId(),
        maxWidth: window.screen.width,
        maxHeight: window.screen.height
      }
    };
  }
};

const isSupport = () => {
  const browser = userAgent.name;
  return browser === 'chrome' || browser === 'firefox';
};

const getStreamId = async () => {
  if (!await isInstalledExtension()) {
    window.location.href = EXTENSION_URL;
  }

  window.postMessage({ type: 'SCREEN_REQUEST', text: 'start' }, '*');

  return await new Promise(resolve => {
    window.addEventListener('message', function listener({ data: { type, streamId } }) {
      if (type === 'SCREEN_SHARE') {
        window.removeEventListener('message', listener);
        resolve(streamId);
      }

      if (type === 'SCREEN_CANCEL') {
        window.removeEventListener('message', listener);
        resolve(false);
      }
    });
  });
};

const isInstalledExtension = async () => {
  const img = document.createElement('img');
  img.src = `chrome-extension://${EXTENSION_ID}/icon.png`;

  return await new Promise((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
};