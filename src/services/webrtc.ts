/**
 * ═══════════════════════════════════════════════════════════════
 * WebRTC Service — LiveStream Premium
 * Low-latency 1-on-1 video calls and live broadcasting (SFU-style).
 * Handles peer connection lifecycle, ICE, and media management.
 * ═══════════════════════════════════════════════════════════════
 */

import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices } from 'react-native-webrtc';
import { SignalingService } from './firebase';

// ─── STUN/TURN Server Configuration ──────────────────────────
// Use Google's free STUN servers + your own TURN for NAT traversal.
// Replace TURN credentials with your own from Twilio/Xirsys/etc.
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // TURN servers (add your own for reliability behind symmetric NATs)
    {
      urls: 'turn:turn.livestream-premium.com:3478',
      username: 'YOUR_TURN_USERNAME',
      credential: 'YOUR_TURN_CREDENTIAL',
    },
    {
      urls: 'turns:turn.livestream-premium.com:5349',
      username: 'YOUR_TURN_USERNAME',
      credential: 'YOUR_TURN_CREDENTIAL',
    },
  ],
  iceCandidatePoolSize: 10,
};

// ─── SDP Constraints for optimal quality ─────────────────────
const DEFAULT_SDP_CONSTRAINTS = {
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true,
  },
  optional: [],
};

// ─── Media Constraints ────────────────────────────────────────
const HD_VIDEO_CONSTRAINTS = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
  },
};

const AUDIO_ONLY_CONSTRAINTS = {
  video: false,
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

// ─── Callback Types ───────────────────────────────────────────
export type PeerConnectionCallback = {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  onCallEnded?: () => void;
  onError?: (error: Error) => void;
};

/**
 * WebRTCService — Singleton class managing all WebRTC peer connections.
 *
 * Architecture:
 * - 1-on-1 calls: Direct P2P connection via SDP exchange over Firebase RTD
 * - Broadcasting: Host connects to a signaling server (or uses Firebase RTD)
 *   and viewers connect as passive receivers via a mesh or SFU topology
 *
 * For production broadcasting, you'd want to use a dedicated SFU
 * (e.g., mediasoup, Janus, LiveKit) for scalability. This implementation
 * provides the core WebRTC foundation that can be extended.
 */
class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private myId: string | null = null;
  private callbacks: PeerConnectionCallback = {};
  private unsubscribers: (() => void)[] = [];

  /**
   * Initialize local media stream (camera + microphone).
   * Call this before making or receiving calls.
   */
  async initializeLocalStream(
    options?: { video: boolean; audio: boolean; frontCamera: boolean }
  ): Promise<MediaStream> {
    const constraints = {
      video: options?.video !== false,
      audio: options?.audio !== false,
      ...HD_VIDEO_CONSTRAINTS,
    };

    if (options?.video === false) {
      constraints.video = false;
    }

    this.localStream = await mediaDevices.getUserMedia(constraints);

    // Set up audio tracks if needed
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = options?.audio !== false;
      });

      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = options?.video !== false;
      });
    }

    this.callbacks.onLocalStream?.(this.localStream);
    return this.localStream;
  }

  /**
   * Create a peer connection and attach local tracks.
   * Used when initiating a call.
   */
  createPeerConnection(
    callId: string,
    myId: string,
    callbacks: PeerConnectionCallback
  ): RTCPeerConnection {
    this.callId = callId;
    this.myId = myId;
    this.callbacks = callbacks;

    // Clean up any existing connection
    this.closePeerConnection();

    // Create new peer connection with ICE servers
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Listen for remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind);
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream!.addTrack(track);
      });
      this.callbacks.onRemoteStream?.(this.remoteStream);
    };

    // ICE candidate handling — send candidates to Firebase
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        SignalingService.sendICECandidate(
          callId,
          event.candidate.toJSON(),
          myId
        );
      }
    };

    // Connection state monitoring
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('[WebRTC] ICE Connection State:', state);
      this.callbacks.onIceConnectionStateChange?.(state!);

      if (
        state === 'disconnected' ||
        state === 'failed' ||
        state === 'closed'
      ) {
        this.callbacks.onCallEnded?.();
      }
    };

    // Listen for ICE candidates from remote peer
    const unsubCandidates = SignalingService.listenForCandidates(
      callId,
      myId,
      async (candidate) => {
        try {
          await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      }
    );
    this.unsubscribers.push(unsubCandidates);

    return this.peerConnection;
  }

  /**
   * Initiate a 1-on-1 video call.
   * Creates offer, sets local description, and signals via Firebase.
   */
  async initiateCall(
    callId: string,
    myId: string,
    calleeId: string,
    callbacks: PeerConnectionCallback
  ): Promise<void> {
    const pc = this.createPeerConnection(callId, myId, callbacks);

    try {
      // Create and set local SDP offer
      const offer = await pc.createOffer({
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true,
        },
        optional: [],
      });
      await pc.setLocalDescription(offer);

      // Send offer via Firebase signaling
      await SignalingService.initiateCall(callId, myId, calleeId, offer);

      // Wait for answer
      const unsubAnswer = SignalingService.listenForAnswer(
        callId,
        async (answer) => {
          try {
            await pc.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
            console.log('[WebRTC] Answer set successfully');
          } catch (err) {
            console.error('[WebRTC] Error setting answer:', err);
            this.callbacks.onError?.(err as Error);
          }
        }
      );
      this.unsubscribers.push(unsubAnswer);
    } catch (err) {
      console.error('[WebRTC] Error initiating call:', err);
      this.callbacks.onError?.(err as Error);
      throw err;
    }
  }

  /**
   * Accept an incoming call.
   * Sets remote description (offer) and sends answer.
   */
  async acceptCall(
    callId: string,
    myId: string,
    offer: RTCSessionDescriptionInit,
    callbacks: PeerConnectionCallback
  ): Promise<void> {
    const pc = this.createPeerConnection(callId, myId, callbacks);

    try {
      // Set the remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await pc.createAnswer(DEFAULT_SDP_CONSTRAINTS);
      await pc.setLocalDescription(answer);

      // Send answer via Firebase
      await SignalingService.answerCall(callId, answer);
    } catch (err) {
      console.error('[WebRTC] Error accepting call:', err);
      this.callbacks.onError?.(err as Error);
      throw err;
    }
  }

  /**
   * Toggle local microphone mute state.
   */
  toggleMicrophone(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle local camera on/off.
   */
  toggleCamera(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Switch between front and rear camera.
   */
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Use the native switchCamera capability
    // This works with react-native-webrtc on iOS/Android
    const currentFacing = videoTrack._isFrontCamera ?? true;
    videoTrack._isFrontCamera = !currentFacing;

    // Stop current video track and get new one
    videoTrack.stop();
    this.localStream.removeTrack(videoTrack);

    const newConstraints = {
      video: {
        ...HD_VIDEO_CONSTRAINTS.video,
        facingMode: currentFacing ? 'environment' : 'user',
      },
      audio: false,
    };

    const newStream = await mediaDevices.getUserMedia(newConstraints);
    const newVideoTrack = newStream.getVideoTracks()[0];
    newVideoTrack._isFrontCamera = !currentFacing;

    this.localStream.addTrack(newVideoTrack);
    this.callbacks.onLocalStream?.(this.localStream);
  }

  /**
   * End the current call and clean up all resources.
   */
  async endCall(): Promise<void> {
    if (this.callId) {
      await SignalingService.endCall(this.callId);
    }

    this.closePeerConnection();

    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Clean up Firebase listeners
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    this.callId = null;
    this.myId = null;
    this.remoteStream = null;
    this.callbacks = {};
  }

  /**
   * Close the peer connection without ending the call signaling.
   */
  private closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  /**
   * Get current local stream.
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get current remote stream.
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Check if peer connection is established.
   */
  isConnected(): boolean {
    return (
      this.peerConnection?.iceConnectionState === 'connected' ||
      this.peerConnection?.iceConnectionState === 'completed'
    );
  }
}

// ─── Export Singleton ─────────────────────────────────────────
export const webrtcService = new WebRTCService();
export default webrtcService;
