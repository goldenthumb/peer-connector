import 'webrtc-adapter';

export default class Connector {
  constructor(peer) {
    this._peer = peer;
    this.onIceCandidate = null;
    this.onTrack = null;
    this.onDataChannel = null;
  }

  set onIceCandidate(func) {
    this._peer.onicecandidate = func;
  }

  set onTrack(func) {
    this._peer.ontrack = func;
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
    if (!this._peer.createDataChannel) return;
    return this._peer.createDataChannel(channelName);
  }

  addTrack(stream) {
    if (!stream) return;

    stream.getTracks().forEach(track => {
      this._peer.addTrack(track, stream);
    });
  }

  setLocalDescription(sdp) {
    return this._peer.setLocalDescription(sdp);
  }

  setRemoteDescription(sdp) {
    return this._peer.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  addIceCandidate(candidate) {
    return this._peer.addIceCandidate(candidate);
  }
}