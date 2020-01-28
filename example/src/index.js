/* eslint-disable no-alert */
/* eslint-disable no-console */

import { PeerConnector, getMediaStream, connectWebsocket, Signal } from '../../src';

const $local = document.getElementById('localVideo');
const $connectGroup = document.getElementById('connect-group');
const $videoGroup = document.getElementById('video-group');
const $messages = document.getElementById('messages');
const $messageInput = document.getElementById('message-input');
const $send = document.getElementById('send');
const $connect = document.getElementById('connect');

$connect.addEventListener('click', async () => {
    $connectGroup.style.display = 'none';
    const type = document.querySelector('input[name="media-type"]:checked').value;
    const mediaType = (() => {
        if (type === 'none') return null;
        if (type === 'screen') return { screen: true };
        return { video: true, audio: true };
    })();

    try {
        const stream = mediaType ? await getMediaStream(mediaType) : null;
        $local.srcObject = stream;

        const peerConnector = new PeerConnector({ stream });
        const signal = new Signal({ websocket: await connectWebsocket('ws://localhost:1234') });

        signal.autoSignal(peerConnector);

        peerConnector.on('connect', (peer) => {
            console.log('peer connected', peer);
            peer.send('data channel connected');

            const $remoteVideo = document.createElement('video');
            $remoteVideo.style.width = '33%';
            $remoteVideo.autoplay = true;
            $remoteVideo.srcObject = peer.remoteStream;
            $videoGroup.appendChild($remoteVideo);
            $messageInput.style.display = 'inline-block';
            $send.style.display = 'inline-block';
            $send.addEventListener('click', () => peer.send($messageInput.value));

            peer.on('data', (data) => {
                console.log('data (data channel) : ', data);
                const p = document.createElement('p');
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
