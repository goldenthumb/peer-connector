import peerConnector from '../../src';

const getEl = id => document.getElementById(id);
const createEl = el => document.createElement(el);

const $local = getEl('localVideo');
const $videoGroup = getEl('video-group');
const $messages = getEl('messages');
const $peerConnect = getEl('connect');

$peerConnect.addEventListener('click', async () => {
  try {
    const mediaType = { video: true, audio: true };
    const servers = [{ host: 'localhost', port: 1234 }];
    const pc = await peerConnector({ servers, mediaType });

    $local.srcObject = pc.stream;

    pc.on('connect', (peer) => {
      console.log('peer connected', peer);
      console.log('peers info', pc.peers);

      const $remoteVideo = createEl('video');
      $videoGroup.appendChild($remoteVideo);
      $remoteVideo.style.width = '33%';
      $remoteVideo.srcObject = peer.remoteStream;
      $remoteVideo.play();

      peer.sendMessage('send signal');

      peer.on('open', () => {
        console.log('data channel open');
        peer.sendBuffer('data channel connected');
      });

      peer.on('buffer', (data) => {
        console.log('buffer', data);

        const p = createEl('p');
        p.innerHTML = data;
        $messages.appendChild(p);
      });

      peer.on('message', (data) => {
        console.log('message', data);
      });
    });
  } catch (e) {
    alert(e);
  }
});