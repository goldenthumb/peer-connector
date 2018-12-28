import { detect } from 'detect-browser';
const userAgent = detect();

const EXTENSION_ID = 'mopiaiibclcaiolndiidmkpejmcpjmcf';
const EXTENSION_URL = `https://chrome.google.com/webstore/detail/screen-sharing-extension/${EXTENSION_ID}`;

export default async () => {
  switch (userAgent.name) {
    case 'firefox':
      return { mediaSource: 'screen' };
    case 'chrome':
      if (!await isInstalledExtension()) {
        window.location.href = EXTENSION_URL;
      }

      return  {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: await getStreamId(),
          maxWidth: window.screen.width,
          maxHeight: window.screen.height
        }
      };
    default:
      throw new Error('not support browser');
  }
};

const getStreamId = () => new Promise(resolve => {
  window.postMessage({ type: 'SCREEN_REQUEST', text: 'start' }, '*');
  window.addEventListener('message', function listener({ data: { type, streamId } }) {
    window.removeEventListener('message', listener);
    resolve(type === 'SCREEN_SHARE' ? streamId : false)
  });
});

const isInstalledExtension = () => new Promise((resolve) => {
  const img = document.createElement('img');
  img.src = `chrome-extension://${EXTENSION_ID}/icon.png`;
  img.onload = () => resolve(true);
  img.onerror = () => resolve(false);
});