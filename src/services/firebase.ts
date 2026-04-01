/**
 * ═══════════════════════════════════════════════════════════════
 * Firebase Configuration — LiveStream Premium
 * Real-time database, auth, Firestore, cloud messaging, storage.
 * ═══════════════════════════════════════════════════════════════
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import {
  getDatabase,
} from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Firebase Config (Replace with your own Firebase project credentials) ────
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY_HERE',
  authDomain: 'livestream-premium.firebaseapp.com',
  projectId: 'livestream-premium',
  storageBucket: 'livestream-premium.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890',
  measurementId: 'G-XXXXXXXXXX',
  databaseURL: 'https://livestream-premium-default-rtdb.firebaseio.com',
};

// ─── Initialize Firebase ─────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─── Auth with React Native persistence ───────────────────────
const auth = getAuth(app);

// ─── Firestore ────────────────────────────────────────────────
const db = getFirestore(app);

// Enable offline persistence for Firestore
try {
  enableIndexedDbPersistence(db, {
    synchronizeTabs: true,
  });
} catch (err) {
  if (err.code === 'failed-precondition') {
    console.warn('[Firebase] Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('[Firebase] Persistence not supported in this browser');
  }
}

// ─── Realtime Database ───────────────────────────────────────
const realtimeDb = getDatabase(app);

// ─── Storage ─────────────────────────────────────────────────
const storage = getStorage(app);

// ─── Cloud Messaging (check support) ─────────────────────────
let messaging: any = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export { app, auth, db, realtimeDb, storage, messaging };

// ═══════════════════════════════════════════════════════════════
// FIREBASE SERVICE LAYER
// ═══════════════════════════════════════════════════════════════

/**
 * StreamService — Manages live stream metadata in Firestore
 * Handles stream lifecycle: create, update viewer counts, end stream.
 */
export class StreamService {
  private static readonly STREAMS_COLLECTION = 'streams';
  private static readonly CHAT_SUBCOLLECTION = 'messages';

  /**
   * Create a new live stream document in Firestore.
   * Returns the generated stream ID.
   */
  static async createStream(streamData: {
    hostId: string;
    title: string;
    category: string;
    tags: string[];
    isPrivate: boolean;
  }): Promise<string> {
    const docRef = await db
      .collection(this.STREAMS_COLLECTION)
      .add({
        ...streamData,
        status: 'starting',
        viewerCount: 0,
        peakViewerCount: 0,
        startedAt: Date.now(),
        duration: 0,
        orientation: 'portrait',
      });

    return docRef.id;
  }

  /**
   * Update stream status (e.g., starting → live → ended).
   */
  static async updateStreamStatus(
    streamId: string,
    status: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await db
      .collection(this.STREAMS_COLLECTION)
      .doc(streamId)
      .update({
        status,
        ...additionalData,
        ...(status === 'ended' && { endedAt: Date.now() }),
      });
  }

  /**
   * Update real-time viewer count using Firestore transactions
   * to avoid race conditions.
   */
  static async updateViewerCount(
    streamId: string,
    delta: number
  ): Promise<void> {
    const streamRef = db
      .collection(this.STREAMS_COLLECTION)
      .doc(streamId);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(streamRef);
      if (!doc.exists) return;

      const currentCount = doc.data().viewerCount || 0;
      const peakCount = doc.data().peakViewerCount || 0;
      const newCount = Math.max(0, currentCount + delta);

      transaction.update(streamRef, {
        viewerCount: newCount,
        peakViewerCount: Math.max(peakCount, newCount),
      });
    });
  }

  /**
   * End the stream and calculate total duration.
   */
  static async endStream(streamId: string): Promise<void> {
    const streamRef = db
      .collection(this.STREAMS_COLLECTION)
      .doc(streamId);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(streamRef);
      if (!doc.exists) return;

      const startTime = doc.data().startedAt;
      const duration = Date.now() - startTime;

      transaction.update(streamRef, {
        status: 'ended',
        endedAt: Date.now(),
        duration,
      });
    });
  }

  /**
   * Subscribe to live chat messages for a given stream.
   * Returns an unsubscribe function.
   */
  static subscribeToChat(
    streamId: string,
    onMessage: (message: any) => void
  ): () => void {
    const chatRef = db
      .collection(this.STREAMS_COLLECTION)
      .doc(streamId)
      .collection(this.CHAT_SUBCOLLECTION)
      .orderBy('timestamp', 'asc')
      .limitToLast(100);

    return chatRef.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          onMessage({ id: change.doc.id, ...change.doc.data() });
        }
      });
    });
  }

  /**
   * Send a chat message to a live stream.
   */
  static async sendChatMessage(
    streamId: string,
    message: {
      senderId: string;
      sender: any;
      type: string;
      content: string;
      color?: string;
    }
  ): Promise<void> {
    await db
      .collection(this.STREAMS_COLLECTION)
      .doc(streamId)
      .collection(this.CHAT_SUBCOLLECTION)
      .add({
        ...message,
        streamId,
        timestamp: Date.now(),
        isHighlighted: false,
      });
  }

  /**
   * Get active (live) streams for discovery feed.
   */
  static async getActiveStreams(
    category?: string,
    limit: number = 20
  ): Promise<any[]> {
    let query = db
      .collection(this.STREAMS_COLLECTION)
      .where('status', '==', 'live')
      .orderBy('viewerCount', 'desc')
      .limit(limit);

    if (category) {
      query = db
        .collection(this.STREAMS_COLLECTION)
        .where('status', '==', 'live')
        .where('category', '==', category)
        .orderBy('viewerCount', 'desc')
        .limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

/**
 * PresenceService — Tracks user online/offline status
 * in Firebase Realtime Database for real-time presence indicators.
 */
export class PresenceService {
  private static readonly PRESENCE_PATH = 'presence';
  private static readonly ONLINE_USERS_PATH = 'onlineUsers';

  /**
   * Set the current user as online.
   * Uses Firebase RTD's onDisconnect() for automatic cleanup.
   */
  static async goOnline(userId: string): Promise<void> {
    const userPresenceRef = realtimeDb
      .ref(`${this.PRESENCE_PATH}/${userId}`);

    await userPresenceRef.onDisconnect().remove();
    await userPresenceRef.set({
      status: 'online',
      lastSeen: Date.now(),
    });

    // Also add to the online users index
    const onlineRef = realtimeDb
      .ref(`${this.ONLINE_USERS_PATH}/${userId}`);
    await onlineRef.onDisconnect().remove();
    await onlineRef.set(true);
  }

  /**
   * Set the current user as offline.
   */
  static async goOffline(userId: string): Promise<void> {
    await realtimeDb
      .ref(`${this.PRESENCE_PATH}/${userId}`)
      .set({
        status: 'offline',
        lastSeen: Date.now(),
      });

    await realtimeDb
      .ref(`${this.ONLINE_USERS_PATH}/${userId}`)
      .remove();
  }

  /**
   * Listen to a specific user's online status changes.
   */
  static subscribeToUserPresence(
    userId: string,
    callback: (isOnline: boolean, lastSeen: number) => void
  ): () => void {
    const ref = realtimeDb.ref(`${this.PRESENCE_PATH}/${userId}`);
    const listener = ref.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data.status === 'online', data.lastSeen || 0);
      } else {
        callback(false, 0);
      }
    });

    return () => ref.off('value', listener);
  }

  /**
   * Get the count of currently online users.
   */
  static async getOnlineCount(): Promise<number> {
    const snapshot = await realtimeDb
      .ref(this.ONLINE_USERS_PATH)
      .once('value');
    return snapshot.numChildren();
  }
}

/**
 * SignalingService — WebRTC signaling via Firebase Realtime Database.
 * Handles SDP offer/answer exchange and ICE candidate trickle.
 */
export class SignalingService {
  private static readonly CALLS_PATH = 'calls';

  /**
   * Create a new call entry and wait for an answer.
   */
  static async initiateCall(
    callId: string,
    callerId: string,
    calleeId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    await realtimeDb
      .ref(`${this.CALLS_PATH}/${callId}`)
      .set({
        callerId,
        calleeId,
        status: 'ringing',
        offer: {
          sdp: offer.sdp,
          type: offer.type,
        },
        createdAt: Date.now(),
      });
  }

  /**
   * Listen for incoming call offers for a given user.
   */
  static listenForIncomingCalls(
    userId: string,
    callback: (callId: string, offer: any, callerId: string) => void
  ): () => void {
    const ref = realtimeDb
      .ref(this.CALLS_PATH)
      .orderByChild('calleeId')
      .equalTo(userId);

    const listener = ref.on('child_added', (snapshot) => {
      const call = snapshot.val();
      if (call.status === 'ringing') {
        callback(snapshot.key, call.offer, call.callerId);
      }
    });

    return () => ref.off('child_added', listener);
  }

  /**
   * Send an SDP answer for an incoming call.
   */
  static async answerCall(
    callId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    await realtimeDb
      .ref(`${this.CALLS_PATH}/${callId}`)
      .update({
        status: 'connected',
        answer: {
          sdp: answer.sdp,
          type: answer.type,
        },
        answeredAt: Date.now(),
      });
  }

  /**
   * Exchange ICE candidates between peers.
   */
  static async sendICECandidate(
    callId: string,
    candidate: RTCIceCandidateInit,
    senderId: string
  ): Promise<void> {
    const candidatesRef = realtimeDb
      .ref(`${this.CALLS_PATH}/${callId}/candidates`)
      .push();

    await candidatesRef.set({
      candidate,
      senderId,
      timestamp: Date.now(),
    });
  }

  /**
   * Listen for new ICE candidates from the remote peer.
   */
  static listenForCandidates(
    callId: string,
    myId: string,
    callback: (candidate: RTCIceCandidateInit) => void
  ): () => void {
    const ref = realtimeDb
      .ref(`${this.CALLS_PATH}/${callId}/candidates`);

    const listener = ref.on('child_added', (snapshot) => {
      const data = snapshot.val();
      if (data && data.senderId !== myId) {
        callback(data.candidate);
      }
    });

    return () => ref.off('child_added', listener);
  }

  /**
   * Listen for the call answer from the callee.
   */
  static listenForAnswer(
    callId: string,
    callback: (answer: RTCSessionDescriptionInit) => void
  ): () => void {
    const ref = realtimeDb.ref(`${this.CALLS_PATH}/${callId}/answer`);
    const listener = ref.on('value', (snapshot) => {
      const answer = snapshot.val();
      if (answer) {
        callback({
          sdp: answer.sdp,
          type: answer.type,
        });
      }
    });

    return () => ref.off('value', listener);
  }

  /**
   * End a call and clean up Firebase entries.
   */
  static async endCall(callId: string): Promise<void> {
    await realtimeDb.ref(`${this.CALLS_PATH}/${callId}`).update({
      status: 'ended',
      endedAt: Date.now(),
    });

    // Clean up after a delay to allow both peers to receive the signal
    setTimeout(async () => {
      await realtimeDb.ref(`${this.CALLS_PATH}/${callId}`).remove();
    }, 5000);
  }
}

export default { app, auth, db, realtimeDb, storage, messaging };
