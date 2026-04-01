/**
 * ═══════════════════════════════════════════════════════════════
 * Zustand Store — LiveStream Premium
 * Global application state management using Zustand for
 * streaming state, UI state, and user preferences.
 * ═══════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import type { User, LiveStream, ChatMessage, FaceSwapState } from '../types';

interface StreamStore {
  // ─── User State ──────────────────────────────────────────
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;

  // ─── Streaming State ─────────────────────────────────────
  currentStream: LiveStream | null;
  isStreaming: boolean;
  streamStartTime: number | null;
  setCurrentStream: (stream: LiveStream | null) => void;
  setStreaming: (value: boolean) => void;
  setStreamStartTime: (time: number | null) => void;

  // ─── Media Controls ──────────────────────────────────────
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isFrontCamera: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleFrontCamera: () => void;
  setMicEnabled: (value: boolean) => void;
  setCameraEnabled: (value: boolean) => void;

  // ─── Face Swap State ─────────────────────────────────────
  faceSwap: FaceSwapState;
  setFaceSwap: (state: Partial<FaceSwapState>) => void;
  resetFaceSwap: () => void;

  // ─── Chat State ──────────────────────────────────────────
  chatMessages: ChatMessage[];
  isChatVisible: boolean;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setChatVisible: (visible: boolean) => void;
  toggleChat: () => void;

  // ─── Viewer State ────────────────────────────────────────
  viewerCount: number;
  peakViewerCount: number;
  setViewerCount: (count: number) => void;
  incrementViewers: (delta: number) => void;

  // ─── UI State ────────────────────────────────────────────
  isFaceSwapPanelOpen: boolean;
  isGiftPanelOpen: boolean;
  setFaceSwapPanelOpen: (open: boolean) => void;
  setGiftPanelOpen: (open: boolean) => void;
}

const initialFaceSwapState: FaceSwapState = {
  isActive: false,
  currentMaskId: null,
  intensity: 0.85,
  smoothing: 0.5,
};

export const useStreamStore = create<StreamStore>((set, get) => ({
  // ─── User ──────────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),

  // ─── Streaming ─────────────────────────────────────────────
  currentStream: null,
  isStreaming: false,
  streamStartTime: null,
  setCurrentStream: (stream) => set({ currentStream: stream }),
  setStreaming: (value) =>
    set({
      isStreaming: value,
      streamStartTime: value ? Date.now() : null,
    }),
  setStreamStartTime: (time) => set({ streamStartTime: time }),

  // ─── Media Controls ───────────────────────────────────────
  isMicEnabled: true,
  isCameraEnabled: true,
  isFrontCamera: true,
  toggleMic: () => {
    const current = get().isMicEnabled;
    set({ isMicEnabled: !current });
  },
  toggleCamera: () => {
    const current = get().isCameraEnabled;
    set({ isCameraEnabled: !current });
  },
  toggleFrontCamera: () => {
    const current = get().isFrontCamera;
    set({ isFrontCamera: !current });
  },
  setMicEnabled: (value) => set({ isMicEnabled: value }),
  setCameraEnabled: (value) => set({ isCameraEnabled: value }),

  // ─── Face Swap ────────────────────────────────────────────
  faceSwap: { ...initialFaceSwapState },
  setFaceSwap: (state) =>
    set((prev) => ({
      faceSwap: { ...prev.faceSwap, ...state },
    })),
  resetFaceSwap: () =>
    set({ faceSwap: { ...initialFaceSwapState } }),

  // ─── Chat ─────────────────────────────────────────────────
  chatMessages: [],
  isChatVisible: true,
  addChatMessage: (message) =>
    set((prev) => ({
      chatMessages: [...prev.chatMessages.slice(-99), message], // Keep last 100
    })),
  clearChat: () => set({ chatMessages: [] }),
  setChatVisible: (visible) => set({ isChatVisible: visible }),
  toggleChat: () => set((prev) => ({ isChatVisible: !prev.isChatVisible })),

  // ─── Viewers ──────────────────────────────────────────────
  viewerCount: 0,
  peakViewerCount: 0,
  setViewerCount: (count) =>
    set((prev) => ({
      viewerCount: count,
      peakViewerCount: Math.max(prev.peakViewerCount, count),
    })),
  incrementViewers: (delta) =>
    set((prev) => {
      const newCount = Math.max(0, prev.viewerCount + delta);
      return {
        viewerCount: newCount,
        peakViewerCount: Math.max(prev.peakViewerCount, newCount),
      };
    }),

  // ─── UI Panels ────────────────────────────────────────────
  isFaceSwapPanelOpen: false,
  isGiftPanelOpen: false,
  setFaceSwapPanelOpen: (open) => set({ isFaceSwapPanelOpen: open }),
  setGiftPanelOpen: (open) => set({ isGiftPanelOpen: open }),
}));
