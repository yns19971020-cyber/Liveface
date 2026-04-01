/**
 * ═════════════════════════════════════════════════════════════════════════════════
 * LiveStreamScreen.js — LiveStream Premium
 *
 * The main live streaming screen. This is the core UI component that brings together:
 *   - Full-screen camera feed with DeepAR face swap AR overlay
 *   - Glassmorphic floating control bar (mic, camera flip, end stream)
 *   - Face Swap mask carousel with Male/Female tabs and hyper-realistic masks
 *   - Real-time chat overlay with glassmorphism styling
 *   - Viewer count, live duration, and host status bar
 *   - Gift panel integration point
 *
 * Architecture Notes:
 *   - Uses React Navigation's native stack for modal presentation
 *   - Integrates with WebRTC service for broadcasting
 *   - Integrates with DeepAR service for face swapping
 *   - Uses Zustand store for global state management
 *   - Firebase Firestore for real-time chat persistence
 *   - React Native Reanimated 3 for buttery 60fps animations
 *   - All animations respect the Animations config from @/theme
 *
 * ═════════════════════════════════════════════════════════════════════════════════
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Keyboard,
  InteractionManager,
} from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  ZoomIn,
  ZoomOut,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, FontAwesome5, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { useStreamStore } from '../store/useStreamStore';
import { deepARService, FACE_MASK_LIBRARY } from '../services/deepar';
import { webrtcService } from '../services/webrtc';
import { StreamService, PresenceService } from '../services/firebase';
import Theme from '../theme';
import type { FaceSwapMask, ChatMessage, FaceSwapGender } from '../types';

// ─── Screen Dimensions ───────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STATUS_BAR_H = StatusBar.currentHeight || 44;
const BOTTOM_SAFE = Platform.OS === 'ios' ? 34 : 0;

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const LiveStreamScreen: React.FC = () => {
  // ─── State ───────────────────────────────────────────────
  const [isStartingStream, setIsStartingStream] = useState(true);
  const [streamDuration, setStreamDuration] = useState('00:00');
  const [chatInputText, setChatInputText] = useState('');
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const [selectedGender, setSelectedGender] = useState<FaceSwapGender>('female');
  const [activeMaskId, setActiveMaskId] = useState<string | null>(null);
  const [showFaceSwapPanel, setShowFaceSwapPanel] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);

  // ─── Refs ────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatFlatListRef = useRef<FlatList>(null);
  const maskCarouselRef = useRef<FlatList>(null);

  // ─── Animated Values ─────────────────────────────────────
  const controlsOpacity = useSharedValue(1);
  const chatPanelTranslateY = useSharedValue(0);
  const chatPanelHeight = useSharedValue(0);
  const faceSwapPanelTranslateY = useSharedValue(SCREEN_H);
  const liveIndicatorScale = useSharedValue(1);
  const liveIndicatorOpacity = useSharedValue(1);
  const viewerCountScale = useSharedValue(1);
  const giftPanelTranslateY = useSharedValue(SCREEN_H);
  const controlsSlideDown = useSharedValue(0);

  // ─── Zustand Store ───────────────────────────────────────
  const {
    user,
    currentStream,
    isStreaming,
    isMicEnabled,
    isCameraEnabled,
    isFrontCamera,
    faceSwap,
    chatMessages,
    viewerCount,
    isChatVisible,
    toggleMic,
    toggleCamera,
    toggleFrontCamera,
    addChatMessage,
    setFaceSwap,
    setFaceSwapPanelOpen,
    setStreaming,
    setViewerCount,
    toggleChat,
    setChatVisible,
  } = useStreamStore();

  // ─── Mask Data ───────────────────────────────────────────
  const masksByGender = useMemo(() => {
    return {
      male: FACE_MASK_LIBRARY.filter((m) => m.gender === 'male'),
      female: FACE_MASK_LIBRARY.filter((m) => m.gender === 'female'),
    };
  }, []);

  const currentMasks = useMemo(
    () => masksByGender[selectedGender],
    [selectedGender, masksByGender]
  );

  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE EFFECTS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    _initializeStream();

    return () => {
      _cleanupStream();
    };
  }, []);

  /**
   * Stream duration timer — updates every second while live.
   */
  useEffect(() => {
    if (!isStreaming) return;

    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setStreamDuration(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStreaming]);

  /**
   * Pulsing live indicator animation.
   */
  useEffect(() => {
    const animateLiveIndicator = () => {
      liveIndicatorScale.value = withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      );
    };

    const interval = setInterval(animateLiveIndicator, 1600);
    animateLiveIndicator();

    return () => clearInterval(interval);
  }, []);

  /**
   * Auto-scroll chat to bottom when new messages arrive.
   */
  useEffect(() => {
    if (chatMessages.length > 0 && chatFlatListRef.current) {
      InteractionManager.runAfterInteractions(() => {
        chatFlatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [chatMessages]);

  // ═══════════════════════════════════════════════════════════
  // STREAM INITIALIZATION & CLEANUP
  // ═══════════════════════════════════════════════════════════

  const _initializeStream = useCallback(async () => {
    try {
      // 1. Initialize DeepAR for face swap AR
      await deepARService.initialize();
      deepARService.setCallbacks({
        onFaceDetected: (faces) => {
          // Could update UI to show face detected state
        },
        onMaskLoaded: (maskId) => {
          setActiveMaskId(maskId);
        },
        onError: (error) => {
          console.warn('[LiveStream] DeepAR error:', error);
        },
      });

      // 2. Initialize local media stream via WebRTC
      await webrtcService.initializeLocalStream({
        video: true,
        audio: true,
        frontCamera: true,
      });

      // 3. Create the stream in Firebase
      const streamId = await StreamService.createStream({
        hostId: user?.id || 'demo-host',
        title: 'Live Session',
        category: 'General',
        tags: ['live', 'new'],
        isPrivate: false,
      });

      // 4. Set user presence as online
      if (user?.id) {
        await PresenceService.goOnline(user.id);
      }

      // 5. Subscribe to real-time chat
      const unsubChat = StreamService.subscribeToChat(
        streamId,
        (message) => {
          addChatMessage({
            id: message.id,
            streamId: message.streamId || streamId,
            senderId: message.senderId,
            sender: message.sender || {
              id: 'system',
              displayName: 'System',
              avatarUrl: '',
              level: 0,
              isVerified: false,
            },
            type: message.type || 'text',
            content: message.content,
            color: message.color,
            timestamp: message.timestamp || Date.now(),
            isHighlighted: message.isHighlighted || false,
          });
        }
      );

      // 6. Simulate some initial viewers joining
      _simulateViewers();

      // 7. Transition from loading to live
      setIsStreamLoading(true);
      setTimeout(() => {
        setIsStartingStream(false);
        setStreaming(true);
        setIsStreamLoading(false);
        StreamService.updateStreamStatus(streamId, 'live');

        // Add system message
        addChatMessage({
          id: 'sys-welcome',
          streamId,
          senderId: 'system',
          sender: {
            id: 'system',
            displayName: '🔔 System',
            avatarUrl: '',
            level: 99,
            isVerified: true,
          },
          type: 'system',
          content: '🎉 Welcome to the live stream! Say hello in the chat!',
          timestamp: Date.now(),
          isHighlighted: true,
        });
      }, 2500);

    } catch (error) {
      console.error('[LiveStream] Initialization error:', error);
      Alert.alert('Stream Error', 'Failed to start the live stream. Please try again.');
    }
  }, [user]);

  const _cleanupStream = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    webrtcService.endCall();
    deepARService.destroy();
    if (user?.id) PresenceService.goOffline(user.id);
    setStreaming(false);
  }, [user]);

  /**
   * Simulate viewer count changes for demo purposes.
   * In production, this would be driven by actual connections.
   */
  const _simulateViewers = useCallback(() => {
    const simulate = () => {
      const delta = Math.floor(Math.random() * 5) - 1; // -1 to +3
      setViewerCount(viewerCount + delta);
      viewerCountScale.value = withSpring(1.3, {}, () => {
        viewerCountScale.value = withSpring(1);
      });
    };

    // Initial burst
    setTimeout(() => setViewerCount(12), 3000);
    setTimeout(() => setViewerCount(28), 6000);
    setTimeout(() => setViewerCount(45), 10000);

    // Periodic fluctuations
    const interval = setInterval(simulate, 8000 + Math.random() * 12000);
    return () => clearInterval(interval);
  }, [viewerCount]);

  // ═══════════════════════════════════════════════════════════
  // HANDLER FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * End the current live stream.
   * Shows confirmation dialog, then cleans up all resources.
   */
  const handleEndStream = useCallback(() => {
    Alert.alert(
      'End Stream',
      'Are you sure you want to end this live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: () => {
            // Clean up and navigate back
            _cleanupStream();
            // In a real app, you'd navigate back to the home screen
            // navigation.navigate('Home');
          },
        },
      ]
    );
  }, []);

  /**
   * Toggle microphone mute on/off.
   */
  const handleToggleMic = useCallback(() => {
    toggleMic();
    webrtcService.toggleMicrophone(!isMicEnabled);
    // Haptic feedback
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics').default;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  }, [toggleMic, isMicEnabled]);

  /**
   * Toggle camera on/off.
   */
  const handleToggleCamera = useCallback(() => {
    toggleCamera();
    webrtcService.toggleCamera(!isCameraEnabled);
  }, [toggleCamera, isCameraEnabled]);

  /**
   * Switch between front and rear camera.
   */
  const handleFlipCamera = useCallback(() => {
    toggleFrontCamera();
    webrtcService.switchCamera();
  }, [toggleFrontCamera]);

  /**
   * Select and apply a face swap mask.
   */
  const handleSelectMask = useCallback(
    async (mask: FaceSwapMask) => {
      if (mask.isPremium) {
        Alert.alert(
          'Premium Mask',
          `The "${mask.name}" mask requires a Premium subscription. Subscribe to unlock all masks!`,
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Subscribe', onPress: () => {} },
          ]
        );
        return;
      }

      try {
        if (activeMaskId === mask.id) {
          // Deselect current mask
          await deepARService.removeMask();
          setActiveMaskId(null);
          setFaceSwap({ isActive: false, currentMaskId: null });
        } else {
          // Load new mask
          await deepARService.loadMask(mask.id);
          await deepARService.setIntensity(faceSwap.intensity);
          await deepARService.setSmoothing(faceSwap.smoothing);
          setActiveMaskId(mask.id);
          setFaceSwap({ isActive: true, currentMaskId: mask.id });
        }
      } catch (error) {
        console.error('[LiveStream] Error selecting mask:', error);
      }
    },
    [activeMaskId, faceSwap.intensity, faceSwap.smoothing, setFaceSwap]
  );

  /**
   * Switch gender tab in face swap panel.
   */
  const handleGenderTabChange = useCallback(
    (gender: FaceSwapGender) => {
      setSelectedGender(gender);
      // Reset carousel position
      setTimeout(() => {
        maskCarouselRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    },
    []
  );

  /**
   * Toggle the face swap panel visibility.
   */
  const handleToggleFaceSwapPanel = useCallback(() => {
    const newOpen = !showFaceSwapPanel;
    setShowFaceSwapPanel(newOpen);
    faceSwapPanelTranslateY.value = newOpen
      ? withSpring(0, {
          damping: 25,
          stiffness: 200,
          velocity: 2,
        })
      : withTiming(SCREEN_H, { duration: 400, easing: Easing.out(Easing.cubic) });
    setFaceSwapPanelOpen(newOpen);
  }, [showFaceSwapPanel, setFaceSwapPanelOpen]);

  /**
   * Toggle the gift panel visibility.
   */
  const handleToggleGiftPanel = useCallback(() => {
    const newOpen = !showGiftPanel;
    setShowGiftPanel(newOpen);
    giftPanelTranslateY.value = newOpen
      ? withSpring(0, { damping: 25, stiffness: 200 })
      : withTiming(SCREEN_H, { duration: 350 });
  }, [showGiftPanel]);

  /**
   * Send a chat message.
   */
  const handleSendChatMessage = useCallback(async () => {
    if (!chatInputText.trim()) return;

    const messageText = chatInputText.trim();
    setChatInputText('');
    Keyboard.dismiss();
    setIsChatInputFocused(false);

    // Add optimistic message to local state
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      streamId: currentStream?.id || 'demo',
      senderId: user?.id || 'me',
      sender: {
        id: user?.id || 'me',
        displayName: user?.displayName || 'You',
        avatarUrl: user?.avatarUrl || '',
        level: user?.level || 1,
        isVerified: user?.isVerified || false,
      },
      type: 'text',
      content: messageText,
      timestamp: Date.now(),
      isHighlighted: false,
    };

    addChatMessage(tempMessage);

    // Persist to Firebase
    try {
      await StreamService.sendChatMessage(
        currentStream?.id || 'demo',
        {
          senderId: user?.id || 'me',
          sender: tempMessage.sender,
          type: 'text',
          content: messageText,
        }
      );
    } catch (error) {
      console.error('[LiveStream] Error sending chat message:', error);
    }
  }, [chatInputText, user, currentStream, addChatMessage]);

  // ═══════════════════════════════════════════════════════════
  // ANIMATED STYLES
  // ═══════════════════════════════════════════════════════════

  const animatedLiveIndicator = useAnimatedStyle(() => ({
    transform: [{ scale: liveIndicatorScale.value }],
  }));

  const animatedViewerCount = useAnimatedStyle(() => ({
    transform: [{ scale: viewerCountScale.value }],
  }));

  const animatedFaceSwapPanel = useAnimatedStyle(() => ({
    transform: [{ translateY: faceSwapPanelTranslateY.value }],
  }));

  const animatedGiftPanel = useAnimatedStyle(() => ({
    transform: [{ translateY: giftPanelTranslateY.value }],
  }));

  const animatedControlsOpacity = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  // ═══════════════════════════════════════════════════════════
  // RENDER SUB-COMPONENTS
  // ═══════════════════════════════════════════════════════════

  /**
   * Render the camera feed background.
   * In production, this would render the WebRTC/DeepAR camera view.
   */
  const renderCameraFeed = () => (
    <View style={styles.cameraFeedContainer}>
      {/* Dark gradient background (simulates camera feed) */}
      <View style={styles.cameraGradientOverlay} />

      {/* Camera placeholder — replace with DeepAR camera view in production */}
      {/* In production, use: <DeepARView style={StyleSheet.absoluteFill} /> */}
      <View style={styles.cameraPlaceholder}>
        <Ionicons name="videocam" size={64} color="rgba(255,255,255,0.15)" />
        <Text style={styles.cameraPlaceholderText}>
          {isCameraEnabled ? 'Camera Active' : 'Camera Off'}
        </Text>
        {/* Face swap active indicator */}
        {faceSwap.isActive && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.faceSwapActiveBadge}
          >
            <MaterialCommunityIcons name="face-recognition" size={14} color={Theme.Colors.neon.purple} />
            <Text style={styles.faceSwapActiveText}>Face Swap ON</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );

  /**
   * Render the top status bar with live badge, duration, and viewer count.
   */
  const renderTopStatusBar = () => (
    <Animated.View
      entering={SlideInDown.duration(500).easing(Easing.out(Easing.cubic))}
      style={styles.topStatusBar}
    >
      <View style={styles.topBarLeft}>
        {/* Live indicator */}
        <Animated.View style={[styles.liveBadge, animatedLiveIndicator]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </Animated.View>

        {/* Stream duration */}
        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={12} color={Theme.Colors.text.primary} />
          <Text style={styles.durationText}>{streamDuration}</Text>
        </View>
      </View>

      <View style={styles.topBarRight}>
        {/* Viewer count */}
        <Animated.View style={[styles.viewerBadge, animatedViewerCount]}>
          <Ionicons name="eye" size={14} color={Theme.Colors.neon.cyan} />
          <Text style={styles.viewerText}>
            {viewerCount.toLocaleString()}
          </Text>
        </Animated.View>

        {/* Face swap quick toggle */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            faceSwap.isActive && styles.iconButtonActive,
          ]}
          onPress={handleToggleFaceSwapPanel}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="face-recognition"
            size={22}
            color={faceSwap.isActive ? Theme.Colors.neon.purple : Theme.Colors.text.primary}
          />
        </TouchableOpacity>

        {/* Gift button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleToggleGiftPanel}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="gift"
            size={22}
            color={Theme.Colors.neon.pink}
          />
        </TouchableOpacity>

        {/* Close / end stream */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleEndStream}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={Theme.Colors.text.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  /**
   * Render the host info bar (avatar, name, followers).
   */
  const renderHostInfo = () => (
    <Animated.View
      entering={SlideInLeft.duration(600).delay(200)}
      style={styles.hostInfoContainer}
    >
      <View style={styles.hostAvatarContainer}>
        <Image
          source={{
            uri: user?.avatarUrl || 'https://i.pravatar.cc/150?img=68',
          }}
          style={styles.hostAvatar}
        />
        <View style={styles.hostLiveDot} />
      </View>
      <View style={styles.hostDetails}>
        <View style={styles.hostNameRow}>
          <Text style={styles.hostName}>
            {user?.displayName || 'StreamHost'}
          </Text>
          {user?.isVerified && (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={Theme.Colors.neon.cyan}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        <Text style={styles.hostFollowers}>
          {(user?.followersCount || 12500).toLocaleString()} followers
        </Text>
      </View>
    </Animated.View>
  );

  /**
   * Render a single chat message bubble.
   */
  const renderChatMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isSystem = item.type === 'system';
      const isJoin = item.type === 'join';
      const isGift = item.type === 'gift';
      const isHighlighted = item.isHighlighted;

      if (isSystem || isJoin) {
        return (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.systemMessageContainer}
          >
            <Text style={styles.systemMessageText}>{item.content}</Text>
          </Animated.View>
        );
      }

      if (isGift) {
        return (
          <Animated.View
            entering={ZoomIn.duration(500)}
            style={styles.giftMessageContainer}
          >
            <MaterialCommunityIcons
              name="gift"
              size={20}
              color={Theme.Colors.neon.pink}
            />
            <Text style={styles.giftSenderText}>
              {item.sender.displayName}
            </Text>
            <Text style={styles.giftText}>sent a {item.content}</Text>
          </Animated.View>
        );
      }

      return (
        <Animated.View
          entering={SlideInLeft.duration(250).delay(index * 15)}
          style={[
            styles.chatMessageContainer,
            isHighlighted && styles.chatMessageHighlighted,
          ]}
        >
          <Image
            source={{
              uri: item.sender.avatarUrl || `https://i.pravatar.cc/100?u=${item.senderId}`,
            }}
            style={styles.chatAvatar}
          />
          <View style={styles.chatMessageContent}>
            <View style={styles.chatNameRow}>
              <Text
                style={[
                  styles.chatSenderName,
                  { color: item.color || Theme.Colors.neon.cyan },
                ]}
              >
                {item.sender.displayName}
              </Text>
              {item.sender.level > 10 && (
                <View style={styles.chatLevelBadge}>
                  <Text style={styles.chatLevelText}>Lv.{item.sender.level}</Text>
                </View>
              )}
              {item.sender.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color={Theme.Colors.neon.cyan}
                />
              )}
            </View>
            <Text style={styles.chatMessageText}>{item.content}</Text>
          </View>
        </Animated.View>
      );
    },
    []
  );

  /**
   * Render the chat overlay with messages and input.
   */
  const renderChatOverlay = () => (
    <View style={styles.chatContainer}>
      {/* Messages list */}
      {isChatVisible && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.chatMessagesContainer}
        >
          <FlatList
            ref={chatFlatListRef}
            data={chatMessages}
            renderItem={renderChatMessage}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatMessagesList}
            estimatedItemSize={60}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={8}
          />
        </Animated.View>
      )}

      {/* Chat input bar */}
      <Animated.View
        entering={SlideInUp.duration(400).delay(300)}
        style={styles.chatInputContainer}
      >
        <View style={styles.chatInputWrapper}>
          <TextInput
            style={styles.chatInput}
            placeholder="Say something..."
            placeholderTextColor={Theme.Colors.text.tertiary}
            value={chatInputText}
            onChangeText={setChatInputText}
            onFocus={() => setIsChatInputFocused(true)}
            onBlur={() => setIsChatInputFocused(false)}
            onSubmitEditing={handleSendChatMessage}
            returnKeyType="send"
            multiline={false}
            maxLength={200}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              chatInputText.trim().length > 0 && styles.sendButtonActive,
            ]}
            onPress={handleSendChatMessage}
            disabled={chatInputText.trim().length === 0}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={18}
              color={
                chatInputText.trim().length > 0
                  ? Theme.Colors.bg.primary
                  : Theme.Colors.text.tertiary
              }
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );

  /**
   * Render the Face Swap panel with gender tabs and mask carousel.
   */
  const renderFaceSwapPanel = () => (
    <Animated.View
      style={[styles.faceSwapPanel, animatedFaceSwapPanel]}
    >
      {/* Panel header */}
      <View style={styles.faceSwapPanelHeader}>
        <View>
          <Text style={styles.faceSwapPanelTitle}>Face Swap</Text>
          <Text style={styles.faceSwapPanelSubtitle}>
            Choose a hyper-realistic face mask
          </Text>
        </View>
        <TouchableOpacity
          style={styles.faceSwapCloseButton}
          onPress={handleToggleFaceSwapPanel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={Theme.Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Gender tab selector */}
      <View style={styles.genderTabContainer}>
        <TouchableOpacity
          style={[
            styles.genderTab,
            selectedGender === 'female' && styles.genderTabActive,
            selectedGender === 'female' && styles.genderTabFemaleActive,
          ]}
          onPress={() => handleGenderTabChange('female')}
          activeOpacity={0.7}
        >
          <FontAwesome5
            name="venus"
            size={14}
            color={
              selectedGender === 'female'
                ? Theme.Colors.neon.pink
                : Theme.Colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.genderTabText,
              selectedGender === 'female' && styles.genderTabTextActive,
            ]}
          >
            Female
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderTab,
            selectedGender === 'male' && styles.genderTabActive,
            selectedGender === 'male' && styles.genderTabMaleActive,
          ]}
          onPress={() => handleGenderTabChange('male')}
          activeOpacity={0.7}
        >
          <FontAwesome5
            name="mars"
            size={14}
            color={
              selectedGender === 'male'
                ? Theme.Colors.neon.cyan
                : Theme.Colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.genderTabText,
              selectedGender === 'male' && styles.genderTabTextActive,
            ]}
          >
            Male
          </Text>
        </TouchableOpacity>

        {/* Remove mask button */}
        {faceSwap.isActive && (
          <TouchableOpacity
            style={styles.removeMaskButton}
            onPress={() => handleSelectMask({ id: activeMaskId || '' } as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={16} color={Theme.Colors.semantic.error} />
            <Text style={styles.removeMaskText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mask carousel */}
      <View style={styles.maskCarouselContainer}>
        <FlatList
          ref={maskCarouselRef}
          data={currentMasks}
          renderItem={({ item }) => renderMaskCard(item)}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.maskCarouselList}
          decelerationRate="fast"
          snapToInterval={140}
          snapToAlignment="start"
        />
      </View>

      {/* Active mask info */}
      {faceSwap.isActive && activeMaskId && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.activeMaskInfo}>
          <MaterialCommunityIcons
            name="face-recognition"
            size={16}
            color={Theme.Colors.neon.purple}
          />
          <Text style={styles.activeMaskName}>
            Active: {FACE_MASK_LIBRARY.find((m) => m.id === activeMaskId)?.name}
          </Text>
        </Animated.View>
      )}

      {/* Intensity slider placeholder */}
      {faceSwap.isActive && (
        <View style={styles.intensityContainer}>
          <Text style={styles.intensityLabel}>Blending Intensity</Text>
          <View style={styles.intensitySlider}>
            <View
              style={[
                styles.intensityFill,
                { width: `${faceSwap.intensity * 100}%` },
              ]}
            />
          </View>
        </View>
      )}
    </Animated.View>
  );

  /**
   * Render a single mask card in the carousel.
   */
  const renderMaskCard = useCallback(
    (mask: FaceSwapMask) => {
      const isActive = activeMaskId === mask.id;

      return (
        <TouchableOpacity
          key={mask.id}
          style={[
            styles.maskCard,
            isActive && styles.maskCardActive,
            mask.isPremium && styles.maskCardPremium,
          ]}
          onPress={() => handleSelectMask(mask)}
          activeOpacity={0.8}
        >
          {/* Mask thumbnail */}
          <View style={styles.maskThumbnailContainer}>
            <Image
              source={{ uri: mask.thumbnailUrl }}
              style={styles.maskThumbnail}
              defaultSource={require('../assets/images/default-mask.png')}
            />
            {/* Active overlay */}
            {isActive && (
              <Animated.View
                entering={ZoomIn.duration(200)}
                style={styles.maskActiveOverlay}
              >
                <Ionicons name="checkmark-circle" size={28} color={Theme.Colors.neon.green} />
              </Animated.View>
            )}
            {/* Premium badge */}
            {mask.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={10} color={Theme.Colors.neon.orange} />
              </View>
            )}
            {/* New badge */}
            {mask.isNew && !mask.isPremium && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>

          {/* Mask info */}
          <Text
            style={[styles.maskName, isActive && styles.maskNameActive]}
            numberOfLines={1}
          >
            {mask.name}
          </Text>

          {/* Gender icon */}
          <View style={styles.maskGenderIcon}>
            <FontAwesome5
              name={mask.gender === 'female' ? 'venus' : 'mars'}
              size={10}
              color={
                mask.gender === 'female'
                  ? Theme.Colors.neon.pinkDim
                  : Theme.Colors.neon.cyanDim
              }
            />
          </View>
        </TouchableOpacity>
      );
    },
    [activeMaskId]
  );

  /**
   * Render the bottom floating control bar with mic, camera, flip, and end stream buttons.
   */
  const renderControlBar = () => (
    <Animated.View
      entering={SlideInUp.duration(500).delay(200).easing(Easing.out(Easing.cubic))}
      style={styles.controlBarContainer}
    >
      <View style={styles.controlBar}>
        {/* Microphone toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            !isMicEnabled && styles.controlButtonDanger,
          ]}
          onPress={handleToggleMic}
          activeOpacity={0.7}
        >
          <Animated.View entering={ZoomIn.duration(100)}>
            <Ionicons
              name={isMicEnabled ? 'mic' : 'mic-off'}
              size={26}
              color={isMicEnabled ? Theme.Colors.text.primary : Theme.Colors.semantic.error}
            />
          </Animated.View>
          <Text
            style={[
              styles.controlLabel,
              !isMicEnabled && styles.controlLabelDanger,
            ]}
          >
            {isMicEnabled ? 'Mic' : 'Muted'}
          </Text>
        </TouchableOpacity>

        {/* Camera toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            !isCameraEnabled && styles.controlButtonDanger,
          ]}
          onPress={handleToggleCamera}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isCameraEnabled ? 'camera' : 'camera-off'}
            size={26}
            color={
              isCameraEnabled ? Theme.Colors.text.primary : Theme.Colors.semantic.error
            }
          />
          <Text
            style={[
              styles.controlLabel,
              !isCameraEnabled && styles.controlLabelDanger,
            ]}
          >
            {isCameraEnabled ? 'Camera' : 'Off'}
          </Text>
        </TouchableOpacity>

        {/* Flip camera */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleFlipCamera}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-reverse" size={26} color={Theme.Colors.text.primary} />
          <Text style={styles.controlLabel}>Flip</Text>
        </TouchableOpacity>

        {/* Face swap button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            faceSwap.isActive && styles.controlButtonFaceSwap,
          ]}
          onPress={handleToggleFaceSwapPanel}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="face-recognition"
            size={26}
            color={
              faceSwap.isActive
                ? Theme.Colors.neon.purple
                : Theme.Colors.text.primary
            }
          />
          <Text
            style={[
              styles.controlLabel,
              faceSwap.isActive && styles.controlLabelFaceSwap,
            ]}
          >
            Face
          </Text>
        </TouchableOpacity>

        {/* End stream button */}
        <TouchableOpacity
          style={styles.endStreamButton}
          onPress={handleEndStream}
          activeOpacity={0.8}
        >
          <Animated.View
            entering={ZoomIn.duration(200)}
            style={styles.endStreamIcon}
          >
            <Ionicons name="call" size={26} color={Theme.Colors.text.primary} />
          </Animated.View>
          <Text style={styles.endStreamLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  /**
   * Render the gift panel (simplified).
   */
  const renderGiftPanel = () => (
    <Animated.View
      style={[styles.giftPanel, animatedGiftPanel]}
    >
      <View style={styles.giftPanelHeader}>
        <Text style={styles.giftPanelTitle}>Send a Gift</Text>
        <TouchableOpacity
          style={styles.giftCloseButton}
          onPress={handleToggleGiftPanel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={Theme.Colors.text.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.giftGrid}>
        {['🌹', '💎', '👑', '🚀', '❤️', '🔥', '🎪', '🌟'].map((emoji, i) => (
          <TouchableOpacity
            key={i}
            style={styles.giftItem}
            activeOpacity={0.7}
          >
            <Text style={styles.giftEmoji}>{emoji}</Text>
            <Text style={styles.giftPrice}>{[10, 50, 100, 200, 5, 25, 500, 1000][i]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  /**
   * Render the stream starting overlay.
   */
  const renderStartingOverlay = () => (
    <Animated.View
      exiting={FadeOut.duration(500)}
      style={styles.startingOverlay}
    >
      <View style={styles.startingContent}>
        <ActivityIndicator
          size="large"
          color={Theme.Colors.neon.cyan}
          style={{ marginBottom: 20 }}
        />
        <Text style={styles.startingTitle}>Starting Your Stream</Text>
        <Text style={styles.startingSubtitle}>
          Preparing camera, AR engine, and chat...
        </Text>
      </View>
    </Animated.View>
  );

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Camera feed background */}
        {renderCameraFeed()}

        {/* Top status bar */}
        {renderTopStatusBar()}

        {/* Host info */}
        {renderHostInfo()}

        {/* Chat overlay */}
        {renderChatOverlay()}

        {/* Bottom control bar */}
        {renderControlBar()}

        {/* Face swap panel (slides up from bottom) */}
        {renderFaceSwapPanel()}

        {/* Gift panel (slides up from bottom) */}
        {renderGiftPanel()}

        {/* Starting overlay */}
        {isStartingStream && renderStartingOverlay()}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES — Dark Glassmorphism + Neon Accents
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.bg.primary,
  },
  safeArea: {
    flex: 1,
  },

  // ─── Camera Feed ──────────────────────────────────────────
  cameraFeedContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0D14',
  },
  cameraGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #0A0A1A 0%, #1A0A2E 50%, #0A1628 100%)',
  },
  cameraPlaceholderText: {
    color: Theme.Colors.text.tertiary,
    fontSize: Theme.Typography.sizes.sm,
    marginTop: 8,
  },
  faceSwapActiveBadge: {
    position: 'absolute',
    bottom: SCREEN_H * 0.35,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.BorderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  faceSwapActiveText: {
    color: Theme.Colors.neon.purple,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '600',
    marginLeft: 4,
  },

  // ─── Top Status Bar ───────────────────────────────────────
  topStatusBar: {
    position: 'absolute',
    top: STATUS_BAR_H + 4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.Spacing.base,
    zIndex: 20,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.BorderRadius.pill,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.6)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.Colors.glass.medium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.BorderRadius.pill,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
  },
  durationText: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '500',
    fontVariantNumeric: 'tabular-nums',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.Colors.glass.medium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.BorderRadius.pill,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
  },
  viewerText: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '600',
    fontVariantNumeric: 'tabular-nums',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },

  // ─── Host Info ────────────────────────────────────────────
  hostInfoContainer: {
    position: 'absolute',
    top: STATUS_BAR_H + 50,
    left: Theme.Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.Colors.glass.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.BorderRadius.xl,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
    zIndex: 15,
  },
  hostAvatarContainer: {
    position: 'relative',
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Theme.Colors.neon.cyan,
  },
  hostLiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.Colors.semantic.live,
    borderWidth: 2,
    borderColor: Theme.Colors.bg.primary,
  },
  hostDetails: {
    marginLeft: 10,
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostName: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.md,
    fontWeight: '600',
  },
  hostFollowers: {
    color: Theme.Colors.text.secondary,
    fontSize: Theme.Typography.sizes.xs,
    marginTop: 1,
  },

  // ─── Chat Overlay ─────────────────────────────────────────
  chatContainer: {
    position: 'absolute',
    left: 0,
    bottom: 140,
    right: 0,
    top: STATUS_BAR_H + 120,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  chatMessagesContainer: {
    flex: 1,
    paddingLeft: Theme.Spacing.base,
    paddingBottom: Theme.Spacing.sm,
  },
  chatMessagesList: {
    paddingTop: Theme.Spacing.sm,
  },
  chatMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    maxWidth: SCREEN_W * 0.85,
  },
  chatMessageHighlighted: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Theme.BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
  },
  chatMessageContent: {
    flex: 1,
    backgroundColor: Theme.Colors.glass.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.BorderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.borderLight,
  },
  chatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  chatSenderName: {
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '700',
  },
  chatLevelBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.25)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Theme.BorderRadius.xs,
  },
  chatLevelText: {
    color: Theme.Colors.neon.orange,
    fontSize: 9,
    fontWeight: '700',
  },
  chatMessageText: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.sm,
    lineHeight: 18,
  },
  systemMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.BorderRadius.pill,
    marginBottom: 6,
    marginLeft: 40,
  },
  systemMessageText: {
    color: Theme.Colors.neon.green,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '500',
  },
  giftMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 45, 120, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.BorderRadius.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 120, 0.25)',
    marginLeft: 40,
  },
  giftSenderText: {
    color: Theme.Colors.neon.pink,
    fontSize: Theme.Typography.sizes.sm,
    fontWeight: '600',
  },
  giftText: {
    color: Theme.Colors.text.secondary,
    fontSize: Theme.Typography.sizes.sm,
  },

  // ─── Chat Input ───────────────────────────────────────────
  chatInputContainer: {
    paddingHorizontal: Theme.Spacing.base,
    paddingBottom: 4,
  },
  chatInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.Colors.glass.medium,
    borderRadius: Theme.BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
    paddingHorizontal: 4,
    paddingRight: 4,
    height: 48,
  },
  chatInput: {
    flex: 1,
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.base,
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: '100%',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.Colors.glass.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: Theme.Colors.neon.cyan,
    ...Theme.Shadows.neon(Theme.Colors.neon.cyan),
  },

  // ─── Control Bar ──────────────────────────────────────────
  controlBarContainer: {
    position: 'absolute',
    bottom: BOTTOM_SAFE + 16,
    left: 0,
    right: 0,
    paddingHorizontal: Theme.Spacing.md,
    zIndex: 25,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: Theme.Colors.glass.light,
    paddingVertical: Theme.Spacing.md,
    paddingHorizontal: Theme.Spacing.base,
    borderRadius: Theme.BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
    ...Theme.Shadows.card,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.Colors.glass.medium,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.borderLight,
  },
  controlButtonDanger: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  controlButtonFaceSwap: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
    ...Theme.Shadows.neonGlow(Theme.Colors.neon.purple, 0.2),
  },
  controlLabel: {
    color: Theme.Colors.text.secondary,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  controlLabelDanger: {
    color: Theme.Colors.semantic.error,
  },
  controlLabelFaceSwap: {
    color: Theme.Colors.neon.purple,
  },
  endStreamButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.Colors.semantic.live,
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 48, 0.6)',
    ...Theme.Shadows.neonGlow(Theme.Colors.semantic.live, 0.4),
  },
  endStreamIcon: {
    transform: [{ rotate: '135deg' }],
  },
  endStreamLabel: {
    color: Theme.Colors.text.primary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },

  // ─── Face Swap Panel ──────────────────────────────────────
  faceSwapPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(16, 16, 24, 0.97)',
    borderTopLeftRadius: Theme.BorderRadius.xxl,
    borderTopRightRadius: Theme.BorderRadius.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Theme.Colors.glass.border,
    paddingBottom: BOTTOM_SAFE + 16,
    paddingHorizontal: Theme.Spacing.base,
    paddingTop: Theme.Spacing.lg,
    zIndex: 40,
    maxHeight: SCREEN_H * 0.52,
    ...Theme.Shadows.elevated,
  },
  faceSwapPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.Spacing.lg,
  },
  faceSwapPanelTitle: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.lg,
    fontWeight: '700',
  },
  faceSwapPanelSubtitle: {
    color: Theme.Colors.text.tertiary,
    fontSize: Theme.Typography.sizes.xs,
    marginTop: 2,
  },
  faceSwapCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gender tabs
  genderTabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Theme.Spacing.base,
    alignItems: 'center',
  },
  genderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.BorderRadius.pill,
    backgroundColor: Theme.Colors.glass.light,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
  },
  genderTabActive: {
    borderWidth: 1.5,
  },
  genderTabFemaleActive: {
    backgroundColor: 'rgba(255, 45, 120, 0.15)',
    borderColor: 'rgba(255, 45, 120, 0.5)',
  },
  genderTabMaleActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: 'rgba(0, 240, 255, 0.5)',
  },
  genderTabText: {
    color: Theme.Colors.text.secondary,
    fontSize: Theme.Typography.sizes.sm,
    fontWeight: '600',
  },
  genderTabTextActive: {
    color: Theme.Colors.text.primary,
  },
  removeMaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.BorderRadius.pill,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    marginLeft: 'auto',
  },
  removeMaskText: {
    color: Theme.Colors.semantic.error,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '600',
  },

  // Mask carousel
  maskCarouselContainer: {
    marginBottom: Theme.Spacing.md,
  },
  maskCarouselList: {
    paddingVertical: Theme.Spacing.sm,
    gap: 12,
  },
  maskCard: {
    width: 120,
    alignItems: 'center',
    marginRight: 12,
  },
  maskCardActive: {
    // Active state is handled via the overlay
  },
  maskCardPremium: {
    // Premium state
  },
  maskThumbnailContainer: {
    width: 120,
    height: 120,
    borderRadius: Theme.BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Theme.Colors.glass.medium,
    borderWidth: 2,
    borderColor: Theme.Colors.glass.border,
  },
  maskThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  maskActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.BorderRadius.lg,
  },
  premiumBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Theme.BorderRadius.xs,
    backgroundColor: Theme.Colors.neon.cyan,
  },
  newBadgeText: {
    color: Theme.Colors.bg.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  maskName: {
    color: Theme.Colors.text.secondary,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  maskNameActive: {
    color: Theme.Colors.neon.green,
    fontWeight: '700',
  },
  maskGenderIcon: {
    marginTop: 2,
  },

  // Active mask info
  activeMaskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginBottom: Theme.Spacing.md,
  },
  activeMaskName: {
    color: Theme.Colors.neon.purple,
    fontSize: Theme.Typography.sizes.sm,
    fontWeight: '600',
  },

  // Intensity slider
  intensityContainer: {
    marginTop: Theme.Spacing.sm,
  },
  intensityLabel: {
    color: Theme.Colors.text.secondary,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '500',
    marginBottom: 6,
  },
  intensitySlider: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.Colors.glass.medium,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Theme.Colors.neon.purple,
  },

  // ─── Gift Panel ───────────────────────────────────────────
  giftPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(16, 16, 24, 0.97)',
    borderTopLeftRadius: Theme.BorderRadius.xxl,
    borderTopRightRadius: Theme.BorderRadius.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Theme.Colors.glass.border,
    paddingBottom: BOTTOM_SAFE + 16,
    paddingHorizontal: Theme.Spacing.base,
    paddingTop: Theme.Spacing.lg,
    zIndex: 40,
    ...Theme.Shadows.elevated,
  },
  giftPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.Spacing.lg,
  },
  giftPanelTitle: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.lg,
    fontWeight: '700',
  },
  giftCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  giftItem: {
    width: (SCREEN_W - 60) / 4,
    aspectRatio: 1,
    backgroundColor: Theme.Colors.glass.light,
    borderRadius: Theme.BorderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  giftEmoji: {
    fontSize: 32,
  },
  giftPrice: {
    color: Theme.Colors.neon.orange,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '600',
  },

  // ─── Starting Overlay ─────────────────────────────────────
  startingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Theme.Colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  startingContent: {
    alignItems: 'center',
  },
  startingTitle: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.xl,
    fontWeight: '700',
    marginBottom: 8,
  },
  startingSubtitle: {
    color: Theme.Colors.text.tertiary,
    fontSize: Theme.Typography.sizes.base,
  },
});

export default LiveStreamScreen;
