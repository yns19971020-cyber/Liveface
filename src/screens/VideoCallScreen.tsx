/**
 * VideoCallScreen — 1-on-1 video call using WebRTC.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, withSpring, useAnimatedStyle, FadeIn, ZoomIn,
} from 'react-native-reanimated';
import { useStreamStore } from '../store/useStreamStore';
import { webrtcService } from '../services/webrtc';
import Theme from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const VideoCallScreen = ({ route, navigation }) => {
  const { callId } = route?.params || {};
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState('00:00');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef(null);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withSpring(1.2, { damping: 6, stiffness: 200 }, () => {
      pulseAnim.value = withSpring(1);
    });

    // Simulate connection
    const connectTimeout = setTimeout(() => {
      setCallStatus('connected');
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const mins = Math.floor(elapsed / 60000);
        const secs = Math.floor((elapsed % 60000) / 1000);
        setCallDuration(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }, 1000);
    }, 2000);

    return () => {
      clearTimeout(connectTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleEndCall = useCallback(() => {
    setCallStatus('ended');
    webrtcService.endCall();
    navigation?.goBack?.();
  }, [navigation]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    webrtcService.toggleMicrophone(isMuted);
  }, [isMuted]);

  const handleToggleCamera = useCallback(() => {
    setIsCameraOff((prev) => !prev);
    webrtcService.toggleCamera(isCameraOff);
  }, [isCameraOff]);

  const handleFlipCamera = useCallback(() => {
    webrtcService.switchCamera();
  }, []);

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Remote video (full screen) */}
      <View style={styles.remoteVideo}>
        {callStatus === 'connecting' && (
          <View style={styles.connectingOverlay}>
            <Animated.View style={[styles.pulseRing, animatedPulse]}>
              <Ionicons name="call" size={40} color={Theme.Colors.neon.cyan} />
            </Animated.View>
            <Text style={styles.connectingText}>Connecting...</Text>
          </View>
        )}
        {callStatus === 'connected' && (
          <View style={styles.connectedInfo}>
            <Animated.View entering={FadeIn.duration(500)} style={styles.callDurationBadge}>
              <Ionicons name="call" size={14} color={Theme.Colors.semantic.online} />
              <Text style={styles.callDurationText}>{callDuration}</Text>
            </Animated.View>
          </View>
        )}
      </View>

      {/* Self video (PiP) */}
      {!isCameraOff && callStatus === 'connected' && (
        <Animated.View entering={ZoomIn.duration(300)} style={styles.selfVideo}>
          <View style={styles.selfVideoPlaceholder}>
            <Ionicons name="person" size={32} color={Theme.Colors.text.tertiary} />
          </View>
        </Animated.View>
      )}

      {/* Bottom controls */}
      <SafeAreaView style={styles.controlsContainer}>
        <Animated.View entering={FadeIn.duration(400).delay(500)} style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnDanger]}
            onPress={handleToggleMute}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={26} color={isMuted ? Theme.Colors.semantic.error : 'white'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, isCameraOff && styles.controlBtnDanger]}
            onPress={handleToggleCamera}
          >
            <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={26} color={isCameraOff ? Theme.Colors.semantic.error : 'white'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={handleFlipCamera}>
            <Ionicons name="camera-reverse" size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <Ionicons name="call" size={26} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D14' },
  remoteVideo: {
    flex: 1, backgroundColor: 'linear-gradient(135deg, #0A0A1A, #1A0A2E)',
    justifyContent: 'center', alignItems: 'center',
  },
  connectingOverlay: { alignItems: 'center' },
  pulseRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(0, 240, 255, 0.3)',
    marginBottom: 16,
  },
  connectingText: { color: Theme.Colors.text.secondary, fontSize: Theme.Typography.sizes.md },
  connectedInfo: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' },
  callDurationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Theme.Colors.glass.medium, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: Theme.BorderRadius.pill, borderWidth: 1, borderColor: Theme.Colors.glass.border,
  },
  callDurationText: { color: Theme.Colors.text.primary, fontSize: Theme.Typography.sizes.sm, fontWeight: '600' },
  selfVideo: {
    position: 'absolute', top: 80, right: 16, width: 120, height: 170,
    borderRadius: Theme.BorderRadius.lg, overflow: 'hidden',
    borderWidth: 2, borderColor: Theme.Colors.neon.cyan,
  },
  selfVideoPlaceholder: {
    flex: 1, backgroundColor: Theme.Colors.bg.tertiary,
    justifyContent: 'center', alignItems: 'center',
  },
  controlsContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  controlsRow: {
    flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: 20,
  },
  controlBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  controlBtnDanger: { backgroundColor: 'rgba(255, 59, 48, 0.3)' },
  endCallBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Theme.Colors.semantic.live,
    justifyContent: 'center', alignItems: 'center',
    ...Theme.Shadows.neonGlow(Theme.Colors.semantic.live, 0.4),
  },
});

export default VideoCallScreen;
