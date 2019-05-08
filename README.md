# peer-connector [![npm](https://img.shields.io/npm/v/peer-connector.svg)](https://www.npmjs.com/package/peer-connector)
A module to accept and request WebRTC multi connections by using WebSockets. <br>
Simple WebRTC video/voice/screen and data channels.

### Installing
```bash
$ npm install peer-connector
```
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

## Usage (basic)
Please refer to the file. (example/src/index.js)
```js
// es6
import peerConnector from 'peer-connector';

// commonjs
var peerConnector = require('peer-connector');
```

```js
(async () => {
  try {
    const mediaType = { video: true, audio: true };
    // mediaType = { screen: true } (If you want desktop screen data)

    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // default config
    const servers = [
      {
        host,      // string required
        port,      // number required
        ssl,       // bool optional(default false)
        username,  // string optional
        password,  // string optional
      },
      ...
    ];

    const pc = await peerConnector({
      servers,     // optional
      mediaType,   // optional
      config,      // optional
    });

    console.log(pc.stream); // local stream;

    pc.on('connect', (peer) => {
      // peer is generated each time WebRTC is connected.
      
      peer.on('open', () => {
        console.log('data channel open');
        peer.send('data channel connected');
      });

      peer.on('message', (data) => {
        console.log('message', data);
      });
    });
  } catch (e) {
    console.log(e);
  }
})();
```
<br />

## Usage (custom signal)
You can implement the signaling logic as you wish. (Using websocket and MQTT or other) <br>
Please refer to the file. (example/src/custom.js)

```bash
$ npm run dev-custom
Now open this URL in your browser: http://localhost:3000/
```

```js
import peerConnector from 'peer-connector';

const wsConnect = (url) => {
  return new Promise((resolve, reject) => {
    const webSocket = new WebSocket(url);
    webSocket.onopen = () => resolve(webSocket);
    webSocket.onerror = () => reject(new Error('connect failed.'));
  });
};

(async () => {
  try {
    const pc = await peerConnector({ mediaType });
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

    console.log(pc.stream); // local stream;

    pc.on('connect', (peer) => {
      // peer is generated each time WebRTC is connected.
      
      peer.on('open', () => {
        console.log('data channel open');
        peer.send('data channel connected');
      });

      peer.on('message', (data) => {
        console.log('message', data);
      });
    });
  } catch (e) {
    console.log(e);
  }
})();
```
<br />

### peerConnector
|  Name   | type   | Description                  |
|---------|--------|------------------------------|
| stream  | prop   | media local stream           |
| peers   | prop   | connected peers              |
| connect | event  | triggers when connect WebRTC |
| addPeer | method | add peer                     |
| close   | method | close media local stream     |

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
| onIceCandidate       | event  | triggers when candidates occur                     |
| message              | event  | data received by data channel                      |
| open                 | event  | triggers when data channel open                    |
| close                | event  | triggers when ICE connection or data channel close |
| error                | event  | triggers when data channel error                   |

<br />

### License
MIT
<br />

