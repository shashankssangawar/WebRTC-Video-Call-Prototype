class PeerService {
  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });
  }

  async getOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(offer) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(description));
  }

  async addIceCandidate(candidate) {
    if (!candidate) return;
    await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
  }

  addTrack(track, stream) {
    this.peer.addTrack(track, stream);
  }

  async close() {
    this.peer.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    this.peer.close();
  }
}

export default new PeerService();
