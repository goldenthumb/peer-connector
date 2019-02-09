const CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const MESSAGE = {
  JOIN: '/PEER_CONNECTOR/join',
  REQUEST_CONNECT: '/PEER_CONNECTOR/request/peer-connect',
  SDP: '/PEER_CONNECTOR/sdp',
  CANDIDATE: '/PEER_CONNECTOR/candidate'
};

export { CONFIG, MESSAGE };