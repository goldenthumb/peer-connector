# peer-connector [![npm](https://img.shields.io/npm/v/peer-connector.svg)](https://www.npmjs.com/package/peer-connector)
A module to accept and request WebRTC multi connections by using WebSockets. <br>
Simple WebRTC video/voice/screen and data channels.
<br />
<br />

### Installing
```bash
$ npm install peer-connector
```
<br />
<br />

### Demo(sample test)
- [example page](https://goldenthumb.github.io/peer-connector)
```bash
$ git clone https://github.com/goldenthumb/peer-connector.git
$ cd peer-connector
$ npm install
$ npm run dev

Now open this URL in your browser: http://localhost:3000/
```
<br />
<br />
<br />

## Usage (basic)
Please refer to the file. (example/src/index.js)

```js
import PeerConnector, { getMediaStream, connectWebsocket, Signal } from 'peer-connector';

(async () => {
    /**
     * @param {{ screen: boolean, video: boolean, audio: boolean }} args
     * @param {ReturnType<MediaStream>}
    */
    const stream = await getMediaStream({ video: true, audio: true });

    /**
     * @param {object} props
     * @param {MediaStream} [props.stream]
     * @param {RTCConfiguration} [props.config]     // default { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
     * @param {{ dataChannel: boolean }} [props.option]     // default  { dataChannel: true }
     */
    const peerConnector = new PeerConnector({ stream });

    /**
     * @param {object} props
     * @param {WebSocket} props.websocket
     * @param {string} [props.id]
     */
    const signal = new Signal({ websocket: await connectWebsocket('ws://localhost:1234') });

    signal.autoSignal(peerConnector);

    peerConnector.on('connect', (peer) => {
        // peer is generated each time WebRTC is connected.
        console.log('stream', peer.remoteStream);
        peer.send('data channel connected');
      
        peer.on('data', (data) => {
            console.log('data channel message', data);
        });

        peer.on('close', (data) => {
            console.log('close', data);
        });
    });
})();
```
<br />
<br />
<br />

## Usage (custom)
You can implement the signaling logic as you wish. (Using websocket and MQTT or other) <br>

```js
import PeerConnector, { getMediaStream, connectWebsocket, Signal, SIGNAL_EVENT } from 'peer-connector';

(async () => {
    const stream = await getMediaStream(mediaType);
    const peerConnector = new PeerConnector({ stream });
    const signal = new Signal({ websocket: await connectWebsocket('ws://localhost:1234') });

    signal.send(SIGNAL_EVENT.JOIN);

    signal.on(SIGNAL_EVENT.JOIN, ({ sender }) => {
        signal.send(SIGNAL_EVENT.REQUEST_CONNECT, { receiver: sender });
    });

    signal.on(SIGNAL_EVENT.REQUEST_CONNECT, async ({ sender }) => {
        const peer = peerConnector.createPeer(sender);

        peer.on('iceCandidate', (candidate) => {
            signal.send(SIGNAL_EVENT.CANDIDATE, { receiver: peer.id, candidate });
        });

        peer.createDataChannel(signal.id);
        signal.send(SIGNAL_EVENT.SDP, { receiver: peer.id, sdp: await peer.createOfferSdp() });
    });

    signal.on(SIGNAL_EVENT.SDP, async ({ sender, sdp }) => {
        if (sdp.type === 'answer') {
            const peer = peerConnector.getPeer(sender);
            await peer.setRemoteDescription(sdp);
        } else {
            const peer = peerConnector.createPeer(sender);

            peer.on('iceCandidate', (candidate) => {
                signal.send(SIGNAL_EVENT.CANDIDATE, { receiver: peer.id, candidate });
            });

            await peer.setRemoteDescription(sdp);
            signal.send(SIGNAL_EVENT.SDP, { receiver: peer.id, sdp: await peer.createAnswerSdp() });
        }
    });

    signal.on(SIGNAL_EVENT.CANDIDATE, ({ sender, candidate }) => {
        const peer = peerConnector.getPeer(sender);
        peer.addIceCandidate(candidate);
    });

    peerConnector.on('connect', (peer) => {
        // peer is generated each time WebRTC is connected.
        console.log('stream', peer.remoteStream);
        peer.send('data channel connected');
      
        peer.on('data', (data) => {
            console.log('data channel message', data);
        });

        peer.on('close', (data) => {
            console.log('close', data);
        });
    });
})();
```
<br />
<br />
<br />

### peerConnector
| Name       | type   | Description                  |
|------------|--------|------------------------------|
| stream     | prop   | media local stream           |
| peers      | prop   | connected peers              |
| createPeer | method | add peer                     |
| hasPeer    | method | has peer                     |
| getPeer    | method | get peer                     |
| setPeer    | method | set peer                     |
| removePeer | method | remove peer                  |
| close      | method | close media local stream     |
| destroy    | method | removes all listeners        |
| connect    | event  | triggers when connect WebRTC |
| close      | event  | triggers when connect WebRTC |

<br />
<br />
<br />

### peer
|  Name                | type   | Description                                        |
|----------------------|--------|----------------------------------------------------|
| id                   | prop   | peer id                                            |
| localSdp             | prop   | local sdp                                          |
| localStream          | prop   | local media stream                                 |
| remoteSdp            | prop   | remote sdp                                         |
| remoteStream         | prop   | remote media stream                                |
| createOfferSdp       | method | create offer and set local sdp                     |
| createAnswerSdp      | method | create answer and set local sdp                    |
| createDataChannel    | method | create data channel                                |
| setRemoteDescription | method | set remote sdp                                     |
| addIceCandidate      | method | add ice candidate                                  |
| send                 | method | send data using data channel                       |
| close                | method | peer close                                         |
| destroy              | method | removes all listeners                              |
| iceCandidate         | event  | triggers when candidates occur                     |
| updateIceState       | event  | triggers when oniceconnectionstatechange occur     |
| message              | event  | data received by data channel                      |
| close                | event  | triggers when ICE connection or data channel close |
| error                | event  | triggers when data channel error                   |

<br />
<br />
<br />

### License
MIT

<br />

