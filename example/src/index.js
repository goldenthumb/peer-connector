import peerConnector from '../../src';

const getEl = id => document.getElementById(id);
const createEl = el => document.createElement(el);

const $local = getEl('localVideo');
const $videoGroup = getEl('video-group');
const $messages = getEl('messages');
const $peerConnect = getEl('connect');

$peerConnect.addEventListener('click', async () => {
  const type = document.querySelector('input[name="media-type"]:checked').value;
  const mediaType = type === 'screen' ? { screen: true } : { video: true, audio: true };
  const servers = [{ host: 'localhost', port: 1234 }];

  try {
    const pc = await peerConnector({ servers, mediaType });

    if (pc.stream) {
      $local.srcObject = pc.stream;
    }

    pc.on('connect', (peer) => {
      console.log('peer connected', peer);
      console.log('peers info', pc.peers);

      const $remoteVideo = createEl('video');
      $remoteVideo.style.width = '33%';
      $remoteVideo.autoplay = true;
      $remoteVideo.srcObject = peer.remoteStream;
      $videoGroup.appendChild($remoteVideo);

      peer.on('open', () => {
        console.log('data channel open');
        peer.send('data channel connected');
      });

      peer.on('message', (data) => {
        console.log('message', data);

        const p = createEl('p');
        p.innerHTML = data;
        $messages.appendChild(p);
      });

      peer.on('close', (data) => {
        console.log('called ', data);
      });
    });
  } catch (e) {
    alert(e);
  }
});