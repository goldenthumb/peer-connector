import peerConnector, { getMediaStream } from '../../src';

const getEl = id => document.getElementById(id);
const createEl = el => document.createElement(el);

const $local = getEl('localVideo');
const $videoGroup = getEl('video-group');
const $messages = getEl('messages');
const $peerConnect = getEl('connect');

const wsConnect = (url) => {
  return new Promise((resolve, reject) => {
    const webSocket = new WebSocket(url);
    webSocket.onopen = () => resolve(webSocket);
    webSocket.onerror = () => reject(new Error('connect failed.'));
  });
};

$peerConnect.addEventListener('click', async () => {
  const type = document.querySelector('input[name="media-type"]:checked').value;
  const mediaType = type === 'screen' ? { screen: true } : { video: true, audio: true };
  const userId = Math.random().toString(16).substr(2, 8);

  try {
    const stream = await getMediaStream(mediaType);
    const pc = await peerConnector({ stream });
    const ws = await wsConnect('ws://localhost:1234');

    ws.onmessage = async (message) => {
      if (!message) return;

      const { event, data } = JSON.parse(message.data);

      if (data.receiver && data.receiver !== userId) return;

      if (event === 'join') {
        ws.send(JSON.stringify({
          event: 'request-peer',
          data: {
            sender: userId,
            receiver: data.sender
          }
        }));
      }

      if (event === 'request-peer') {
        const peer = createPeer(data.sender);
        peer.createDataChannel(userId);
        ws.send(JSON.stringify({
          event: 'sdp',
          data: {
            sender: userId,
            receiver: peer.id,
            sdp: await peer.createOfferSdp()
          }
        }));
      }

      if (event === 'sdp') {
        const { sender, sdp } = data;
        const peer = getPeerOrCreate(sender);
        await peer.setRemoteDescription(sdp);

        if (sdp.type === 'offer') {
          ws.send(JSON.stringify({
            event: 'sdp',
            data: {
              sender: userId,
              receiver: peer.id,
              sdp: await peer.createAnswerSdp()
            }
          }));
        }
      }

      if (event === 'candidate') {
        const { sender, candidate } = data;
        const peer = getPeerOrCreate(sender);
        peer.addIceCandidate(candidate);
      }
    };

    const getPeerOrCreate = (id) => {
      return pc.hasPeer(id)
        ? pc.getPeer(id)
        : createPeer(id);
    };

    const createPeer = (id) => pc.createPeer({
      id,
      onIceCandidate: (candidate) => {
        ws.send(JSON.stringify({
          event: 'candidate',
          data: {
            sender: userId,
            receiver: id,
            candidate
          }
        }));
      }
    });

    ws.send(JSON.stringify({ event: 'join', data: { sender: userId } }));

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

      peer.on('data', (data) => {
        console.log('data (data channel) : ', data);

        const p = createEl('p');
        p.innerHTML = data;
        $messages.appendChild(p);
      });
    });
  } catch (e) {
    alert(e);
  }
});
