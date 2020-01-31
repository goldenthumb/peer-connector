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
import { 
    PeerConnector, 
    getMediaStream, 
    connectWebsocket, 
    Signal,
} from 'peer-connector';

(async () => {
    const stream = await getMediaStream({ video: true, audio: true });
    const peerConnector = new PeerConnector({ stream });
    const websocket = await connectWebsocket('ws://localhost:1234');
    const signal = new Signal({ websocket });

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
import { 
    PeerConnector, 
    Peer, 
    getMediaStream, 
    connectWebsocket, 
    Signal, 
    SIGNAL_EVENT 
} from 'peer-connector';

(async () => {
    const stream = await getMediaStream(mediaType);
    const peerConnector = new PeerConnector();
    const websocket = await connectWebsocket('ws://localhost:1234');
    const signal = new Signal({ websocket });

    signal.send(SIGNAL_EVENT.JOIN);

    signal.on(SIGNAL_EVENT.JOIN, ({ sender }) => {
        signal.send(SIGNAL_EVENT.REQUEST_CONNECT, { receiver: sender });
    });

    signal.on(SIGNAL_EVENT.REQUEST_CONNECT, async ({ sender }) => {
        const peer = new Peer({ id: sender, stream });
        peerConnector.addPeer(peer);

        peer.createDataChannel(peerConnector.channelName);

        peer.on('iceCandidate', (candidate) => {
            signal.send(SIGNAL_EVENT.CANDIDATE, { 
                receiver: peer.id, 
                candidate, 
            });
        });

        signal.send(SIGNAL_EVENT.SDP, { 
            receiver: peer.id, 
            sdp: await peer.createOfferSdp(), 
        });
    });

    signal.on(SIGNAL_EVENT.SDP, async ({ sender, sdp }) => {
        if (sdp.type === 'answer') {
            const peer = peerConnector.getPeer(sender);
            await peer.setRemoteDescription(sdp);
        } else {
            const peer = new Peer({ id: sender, stream });
            peerConnector.addPeer(peer);

            peer.on('iceCandidate', (candidate) => {
                signal.send(SIGNAL_EVENT.CANDIDATE, { 
                    receiver: peer.id, 
                    candidate, 
                });
            });

            await peer.setRemoteDescription(sdp);
            signal.send(SIGNAL_EVENT.SDP, { 
                receiver: peer.id, 
                sdp: await peer.createAnswerSdp() 
            });
        }
    });

    signal.on(SIGNAL_EVENT.CANDIDATE, ({ sender, candidate }) => {
        const peer = peerConnector.getPeer(sender);
        peer.addIceCandidate(candidate);
    });

    peerConnector.on('connect', (peer) => {
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

## API
### getMediaStream
```js
/**
 * @param {{ screen?: boolean, video?: boolean, audio?: boolean  }} options
 * @return {Promise<MediaStream>}
*/
const stream = await getMediaStream(options);

// Desktop screen sharing. 
// const stream = await getMediaStream({ screen: true });

// Video and audio sharing.
// const stream = await getMediaStream({ video: true, audio: true });
```
<br />
<br />

### PeerConnector
```js
/**
 * @param {object} [options]
 * @param {MediaStream} [options.stream]
 * @param {RTCConfiguration} [options.config]
 * @param {boolean} [options.channel]
 * @param {string} [options.channelName]
 * @param {RTCDataChannelInit} [options.channelConfig]
 */
const peerConnector = new PeerConnector();
```
<br />
<br />
If opts is specified, then the default options (shown below) will be overridden.

```
{   
    stream: false,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    channel: true,
    channelName: '<random string>',
    channelConfig: {},
}
```
<br />
<br />

| Name       | type   | Description                  |
|------------|--------|------------------------------|
| stream     | prop   | media local stream           |
| peers      | prop   | connected peers              |
| addPeer    | method | add peer                     |
| removePeer | method | remove peer                  |
| hasPeer    | method | has peer                     |
| getPeer    | method | get peer                     |
| close      | method | close media local stream     |
| destroy    | method | removes all listeners        |
| connect    | event  | triggers when connect WebRTC |

<br />
<br />
<br />

### Peer
```js
/**
 * @param {object} props
 * @param {string} [props.id]
 * @param {MediaStream} [props.stream]
 * @param {RTCConfiguration} [props.config]
 * @param {boolean} [props.channel]
 */
const peer = new Peer();
```
<br />
<br />
If opts is specified, then the default options (shown below) will be overridden.

```
{   
    id: '<random string>',
    stream: false,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    channel: true,
}
```
<br />
<br />

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
| changeIceState       | event  | triggers when oniceconnectionstatechange occur     |
| message              | event  | data received by data channel                      |
| close                | event  | triggers when ICE connection or data channel close |
| error                | event  | triggers when data channel error                   |

<br />
<br />
<br />

### Signal
```js
/**
 * @param {object} props
 * @param {WebSocket} props.websocket
 * @param {string} [props.id]
 */
const signal = new Signal();
```
<br />
<br />
If opts is specified, then the default options (shown below) will be overridden.

```
{   
    id: '<random string>',
}
```
<br />
<br />

| Name           | type   | Description                   |
|----------------|--------|-------------------------------|
| id             | prop   | signal id                     |
| send           | method | send message                  |
| autoSignal     | method | auto signaling                |
| destroy        | method | removes all listeners         |
| join           | event  | triggers When user join       |
| requestConnect | event  | triggers when connect request |
| sdp            | event  | triggers when user sdp        |
| candidate      | event  | triggers when user candidate  |

<br />
<br />
<br />

## License
MIT

<br />

