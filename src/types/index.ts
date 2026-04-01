/**
 * ═══════════════════════════════════════════════════════════════
 * TypeScript Type Definitions — LiveStream Premium
 * ═══════════════════════════════════════════════════════════════
 */

// ─── User Types ───────────────────────────────────────────────
export interface User {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  isOnline: boolean;
  lastSeen?: number;
  level: number;
  coins: number;
  isVerified: boolean;
  createdAt: number;
}

// ─── Live Stream Types ────────────────────────────────────────
export type StreamStatus = 'starting' | 'live' | 'ended' | 'error';

export interface LiveStream {
  id: string;
  hostId: string;
  host: User;
  title: string;
  thumbnailUrl: string;
  status: StreamStatus;
  viewerCount: number;
  peakViewerCount: number;
  duration: number;
  startedAt: number;
  endedAt?: number;
  tags: string[];
  isPrivate: boolean;
  category: string;
  orientation: 'portrait' | 'landscape';
}

// ─── WebRTC Types ─────────────────────────────────────────────
export type CallType = 'audio' | 'video';
export type CallDirection = 'incoming' | 'outgoing';
export type CallStatus = 'ringing' | 'connecting' | 'connected' | 'ended' | 'missed' | 'rejected';

export interface WebRTCCall {
  id: string;
  callerId: string;
  calleeId: string;
  caller: User;
  callee: User;
  type: CallType;
  direction: CallDirection;
  status: CallStatus;
  startedAt: number;
  endedAt?: number;
  duration: number;
  iceServers: RTCConfiguration;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'hangup' | 'mute' | 'camera-toggle';
  senderId: string;
  receiverId: string;
  callId: string;
  payload: any;
  timestamp: number;
}

// ─── Face Swap Types ──────────────────────────────────────────
export type FaceSwapGender = 'male' | 'female';
export type FaceSwapCategory = 'realistic' | 'artistic' | 'celebrity-lookalike';

export interface FaceSwapMask {
  id: string;
  name: string;
  gender: FaceSwapGender;
  category: FaceSwapCategory;
  thumbnailUrl: string;
  modelUrl: string;
  isPremium: boolean;
  isNew: boolean;
  popularity: number;
  tags: string[];
}

export interface FaceSwapState {
  isActive: boolean;
  currentMaskId: string | null;
  intensity: number;
  smoothing: number;
}

// ─── Chat Types ───────────────────────────────────────────────
export type MessageType = 'text' | 'gift' | 'system' | 'join' | 'leave' | 'super-chat';

export interface ChatMessage {
  id: string;
  streamId: string;
  senderId: string;
  sender: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'level' | 'isVerified'>;
  type: MessageType;
  content: string;
  giftAmount?: number;
  color?: string;
  timestamp: number;
  isHighlighted: boolean;
}

// ─── Gift Types ───────────────────────────────────────────────
export interface Gift {
  id: string;
  name: string;
  iconUrl: string;
  animationUrl: string;
  price: number;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  soundEnabled: boolean;
}

// ─── Store Types ──────────────────────────────────────────────
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  currentStream: LiveStream | null;
  isStreaming: boolean;
  faceSwapState: FaceSwapState;
  chatMessages: ChatMessage[];
  viewerCount: number;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isFrontCamera: boolean;
}

export interface AppActions {
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setCurrentStream: (stream: LiveStream | null) => void;
  setStreaming: (value: boolean) => void;
  setFaceSwap: (state: Partial<FaceSwapState>) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setViewerCount: (count: number) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleFrontCamera: () => void;
}

// ─── Navigation Types ────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Home: undefined;
  LiveStream: { streamId?: string; isHosting?: boolean };
  Profile: { userId: string };
  Discovery: undefined;
  Notifications: undefined;
  Settings: undefined;
  VideoCall: { callId: string };
  FaceSwapGallery: undefined;
};
