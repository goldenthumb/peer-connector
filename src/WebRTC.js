import Emitter from 'event-emitter';
import getBrowserRTC from 'get-browser-rtc';
import randombytes from 'randombytes';

import Peer from './Peer';
import Connector from './Connector';
import { MESSAGE } from './Signal';

export default class WebRTC {
  constructor({ signal, mediaType, config }) {
    if (!WebRTC.support()) {
      throw new Error('Not support getUserMedia API');
    }

    this._emitter = new Emitter();
    this._channelName = randombytes(20).toString('hex');
    this._peers = new Map();
    this._connectors = new Map();
    this._stream = null;
    this._signal = signal;
    this._options = mediaType;
    this._config = config;
  }

  static support() {
    return !!getBrowserRTC();
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  get stream() {
    return this._stream;
  }

  get peers() {
    return this._peers;
  }

  async _init() {
    this._stream = await navigator.mediaDevices.getUserMedia(this._options);
    this._onMessage();
    return this;
  }

  _getPeer(id) {
    return this._peers.get(id) || this._addPeer(id);
  }

  _addPeer(id) {
    const peer = new Peer(id);
    const connector = new Connector(new RTCPeerConnection(this._config));

    this._peers.set(id, peer);
    this._connectors.set(id, connector);

    return this._peers.get(id);
  }

  _onMessage() {
    const signal = this._signal;

    signal.join();

    signal.on(MESSAGE.JOIN, ({ sender }) => {
      signal.requestPeer(sender);
    });

    signal.on(MESSAGE.REQUEST_CONNECT, async ({ sender }) => {
      const peer = this._addPeer(sender);
      const connector = this._connectors.get(sender);
      const channel = connector.createDataChannel(this._channelName);

      peer._setDataChannel(channel);
      peer._attachDataChannel();

      this._attachEvents({ peer, connector });
      await this._createOffer({ peer, connector });

      signal.sendSdp(peer.id, peer.localSdp);
    });

    signal.on(MESSAGE.SDP, async ({ sender, sdp }) => {
      const peer = this._getPeer(sender);
      const connector = this._connectors.get(sender);
      this._emitter.emit('connect', peer);

      if (sdp.type === 'offer') {
        this._attachEvents({ peer, connector });

        connector.onDataChannel = ({ channel }) => {
          peer._setDataChannel(channel);
          peer._attachDataChannel();
        };

        await connector.setRemoteDescription(sdp);
        await this._createAnswer({ peer, connector });
        peer._setRemoteSdp(sdp);
        signal.sendSdp(peer.id, peer.localSdp);
      } else {
        await connector.setRemoteDescription(sdp);
        peer._setRemoteSdp(sdp);
      }
    });

    signal.on(MESSAGE.CANDIDATE, ({ sender, candidate }) => {
      const connector = this._connectors.get(sender);
      connector.addIceCandidate(candidate);
    });
  }

  async _createOffer({ peer, connector }) {
    const sdp = await connector.createOffer();
    connector.setLocalDescription(sdp);
    peer._setLocalSdp(sdp);
  }

  async _createAnswer({ peer, connector }) {
    const sdp = await connector.createAnswer();
    connector.setLocalDescription(sdp);
    peer._setLocalSdp(sdp);
  }

  _attachEvents({ peer, connector }) {
    peer._setLocalStream(this._stream);
    connector.addTrack(this._stream);

    connector.onIceCandidate = ({ candidate }) => {
      if (!candidate) return;
      this._signal.sendCandidate(peer.id, candidate);
    };

    connector.onTrack = ({ streams }) => {
      peer._setRemoteStream(streams[0]);
    };
  }
}