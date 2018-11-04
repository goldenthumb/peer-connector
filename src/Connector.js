export default class Connector {
  constructor(peer) {
    this._peer = peer;
    this.onIceCandidate = null;
    this.onAddStream = null;
    this.onDataChannel = null;
  }

  set onIceCandidate(func) {
    this._peer.onicecandidate = func;
  }

  set onAddStream(func) {
    this._peer.onaddstream = func;
  }

  set onDataChannel(func) {
    this._peer.ondatachannel = func;
  }

  createOffer() {
    return this._peer.createOffer();
  }

  createAnswer() {
    return this._peer.createAnswer();
  }

  createDataChannel(channelName) {
    return this._peer.createDataChannel(channelName);
  }

  addStream(stream) {
    return this._peer.addStream(stream);
  }

  setLocalDescription(sdp) {
    return this._peer.setLocalDescription(sdp);
  }

  setRemoteDescription(sdp) {
    return this._peer.setRemoteDescription(sdp);
  }

  addIceCandidate(candidate) {
    return this._peer.addIceCandidate(candidate);
  }
}