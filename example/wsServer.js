const server = require('http').createServer();
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server });
const express = require('express');
const app = express();
const port = 1234;

server.on('request', app);
server.listen(port, () => console.log('Listening on ' + server.address().port));

wss.on('connection', ws => {
    ws.on('message', msg => {
        wss.clients.forEach(other => {
            if (other === ws) return;
            other.send(msg);
        });
    });
});
