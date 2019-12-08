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
    // mediaType: video, audio, screen
    const stream = await getMediaStream(mediaType); 
    const servers = [{ host: 'localhost', port: 1234, ssl: false }];
    const pc = await peerConnector({ stream, servers });

    pc.on('connect', (peer) => {
        // peer is generated each time WebRTC is connected.
        console.log('stream', peer.remoteStream);
      
        peer.on('open', () => {
            console.log('data channel open');
            peer.send('data channel connected');
        });

        peer.on('message', (data) => {
            console.log('message', data);
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

(async () => {
    const stream = await getMediaStream(mediaType);
    const pc = await peerConnector({ stream });
    const ws = await wsConnect('ws://localhost:1234');
 
    ws.onmessage = async (message) => {
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
            const peer = pc.hasPeer(sender) ? pc.getPeer(sender) : createPeer(sender);
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
            const peer = pc.hasPeer(sender) ? pc.getPeer(sender) : createPeer(sender);
            peer.addIceCandidate(candidate);
        }
    };
    
    function createPeer(id) {
        return pc.createPeer({
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
       })
    }
  
    ws.send(JSON.stringify({ event: 'join', data: { sender: userId } }));

    pc.on('connect', (peer) => {
        // peer is generated each time WebRTC is connected.
        console.log('stream', peer.remoteStream);
      
        peer.on('open', () => {
            console.log('data channel open');
            peer.send('data channel connected');
        });

        peer.on('message', (data) => {
            console.log('message', data);
        });

        peer.on('close', (data) => {
            console.log('close', data);
        });
    });
})();

function wsConnect(url) {
    return new Promise((resolve, reject) => {
        const webSocket = new WebSocket(url);
        webSocket.onopen = () => resolve(webSocket);
        webSocket.onerror = () => reject(new Error('connect failed.'));
    });
}
```
<br />
<br />
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
| onIceCandidate       | event  | triggers when candidates occur                     |
| updateIceState       | event  | triggers when oniceconnectionstatechange occur     |
| message              | event  | data received by data channel                      |
| open                 | event  | triggers when data channel open                    |
| close                | event  | triggers when ICE connection or data channel close |
| error                | event  | triggers when data channel error                   |

<br />
<br />
<br />

### License
MIT

<br />

