/**
 * ProfileScreen — User profile with stats, bio, and avatar.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Theme from '../theme';

const ProfileScreen = ({ route }) => {
  const userId = route?.params?.userId || 'self';
  const isOwnProfile = userId === 'self';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: `https://i.pravatar.cc/200?img=${isOwnProfile ? 68 : 32}` }}
              style={styles.avatar}
            />
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.displayName}>
            {isOwnProfile ? 'StreamHost' : 'Alex Rivera'}
          </Text>
          <Text style={styles.username}>
            @{isOwnProfile ? 'streamhost' : 'alexrivera'}
          </Text>
          <Text style={styles.bio}>
            🎬 Live streaming enthusiast | Tech lover | Connect with me daily!
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12.5K</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>843</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Streams</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>48.2K</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {isOwnProfile ? (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="pencil" size={16} color={Theme.Colors.bg.primary} />
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]}>
              <Text style={styles.primaryButtonText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]}>
              <Text style={styles.secondaryButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.Colors.bg.primary },
  profileHeader: {
    alignItems: 'center', paddingTop: Theme.Spacing.xxl, paddingBottom: Theme.Spacing.lg,
    paddingHorizontal: Theme.Spacing.base,
  },
  avatarContainer: { position: 'relative', marginBottom: Theme.Spacing.base },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: Theme.Colors.neon.cyan,
  },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4, width: 18, height: 18,
    borderRadius: 9, backgroundColor: Theme.Colors.semantic.online,
    borderWidth: 3, borderColor: Theme.Colors.bg.primary,
  },
  displayName: {
    color: Theme.Colors.text.primary, fontSize: Theme.Typography.sizes.xl, fontWeight: '700',
  },
  username: {
    color: Theme.Colors.text.tertiary, fontSize: Theme.Typography.sizes.sm, marginTop: 2,
  },
  bio: {
    color: Theme.Colors.text.secondary, fontSize: Theme.Typography.sizes.sm, marginTop: 12,
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    marginHorizontal: Theme.Spacing.base, paddingVertical: Theme.Spacing.lg,
    backgroundColor: Theme.Colors.glass.light, borderRadius: Theme.BorderRadius.lg,
    borderWidth: 1, borderColor: Theme.Colors.glass.border,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: Theme.Colors.text.primary, fontSize: Theme.Typography.sizes.lg, fontWeight: '700' },
  statLabel: { color: Theme.Colors.text.tertiary, fontSize: Theme.Typography.sizes.xs, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: Theme.Colors.glass.border },
  actionsContainer: {
    flexDirection: 'row', gap: 12, paddingHorizontal: Theme.Spacing.base, marginTop: Theme.Spacing.base,
  },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Theme.Colors.neon.cyan, paddingVertical: 12, borderRadius: Theme.BorderRadius.pill,
    ...Theme.Shadows.neon(Theme.Colors.neon.cyan),
  },
  primaryButtonText: {
    color: Theme.Colors.bg.primary, fontSize: Theme.Typography.sizes.base, fontWeight: '700',
  },
  secondaryButton: {
    justifyContent: 'center', backgroundColor: Theme.Colors.glass.medium,
    paddingVertical: 12, borderRadius: Theme.BorderRadius.pill,
    borderWidth: 1, borderColor: Theme.Colors.glass.border,
  },
  secondaryButtonText: {
    color: Theme.Colors.text.primary, fontSize: Theme.Typography.sizes.base, fontWeight: '600', textAlign: 'center',
  },
});

export default ProfileScreen;
