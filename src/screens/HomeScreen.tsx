/**
 * ═══════════════════════════════════════════════════════════════
 * Home Screen — LiveStream Premium
 * Discovery feed showing active live streams with glassmorphism cards.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { StreamService } from '../services/firebase';
import Theme from '../theme';
import type { LiveStream } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48) / 2;

const HomeScreen = ({ navigation }) => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStreams = useCallback(async () => {
    try {
      const activeStreams = await StreamService.getActiveStreams(undefined, 20);
      setStreams(activeStreams as any);
    } catch (error) {
      console.error('[Home] Error loading streams:', error);
    }
  }, []);

  useEffect(() => {
    loadStreams();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStreams();
    setRefreshing(false);
  };

  const renderStreamCard = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 80)}
      style={styles.streamCard}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('LiveStream', { streamId: item.id })}
      >
        {/* Thumbnail */}
        <Image
          source={{ uri: item.thumbnailUrl || `https://picsum.photos/seed/${item.id}/400/500` }}
          style={styles.streamThumbnail}
          defaultSource={require('../assets/images/default-stream-thumb.png')}
        />

        {/* Gradient overlay */}
        <View style={styles.streamGradient} />

        {/* Live badge */}
        <View style={styles.streamLiveBadge}>
          <View style={styles.streamLiveDot} />
          <Text style={styles.streamLiveText}>LIVE</Text>
        </View>

        {/* Viewer count */}
        <View style={styles.streamViewerBadge}>
          <Ionicons name="eye" size={12} color="white" />
          <Text style={styles.streamViewerText}>{item.viewerCount || 0}</Text>
        </View>

        {/* Stream info */}
        <View style={styles.streamInfo}>
          <Image
            source={{ uri: item.host?.avatarUrl || `https://i.pravatar.cc/100?u=${item.hostId}` }}
            style={styles.streamHostAvatar}
          />
          <View style={styles.streamHostInfo}>
            <Text style={styles.streamHost} numberOfLines={1}>
              {item.host?.displayName || 'Streamer'}
            </Text>
            <Text style={styles.streamTitle} numberOfLines={1}>
              {item.title || 'Live Stream'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={22} color={Theme.Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Streams grid */}
      <FlatList
        data={streams}
        renderItem={renderStreamCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.streamsList}
        columnWrapperStyle={styles.streamsRow}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.Colors.neon.cyan}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off" size={48} color={Theme.Colors.text.tertiary} />
            <Text style={styles.emptyText}>No live streams right now</Text>
            <Text style={styles.emptySubtext}>Check back soon or start your own!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.Spacing.base,
    paddingTop: Theme.Spacing.lg,
    paddingBottom: Theme.Spacing.base,
  },
  headerTitle: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.xxl,
    fontWeight: '800',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.Colors.glass.border,
  },
  streamsList: {
    paddingHorizontal: Theme.Spacing.base,
    paddingBottom: 120,
  },
  streamsRow: {
    gap: 12,
    marginBottom: 12,
  },
  streamCard: {
    width: CARD_W,
    borderRadius: Theme.BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Theme.Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Theme.Colors.glass.borderLight,
  },
  streamThumbnail: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  streamGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8) 100%)',
  },
  streamLiveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.BorderRadius.pill,
  },
  streamLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  streamLiveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  streamViewerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Theme.BorderRadius.pill,
  },
  streamViewerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  streamHostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Theme.Colors.neon.cyan,
  },
  streamHostInfo: {
    flex: 1,
  },
  streamHost: {
    color: Theme.Colors.text.primary,
    fontSize: Theme.Typography.sizes.xs,
    fontWeight: '600',
  },
  streamTitle: {
    color: Theme.Colors.text.tertiary,
    fontSize: 11,
    marginTop: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Theme.Colors.text.secondary,
    fontSize: Theme.Typography.sizes.md,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: Theme.Colors.text.tertiary,
    fontSize: Theme.Typography.sizes.sm,
    marginTop: 4,
  },
});

export default HomeScreen;
