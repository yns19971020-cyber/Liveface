/**
 * DiscoveryScreen — Browse live streams by categories and tags.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import Theme from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'music', name: 'Music', icon: 'musical-notes' },
  { id: 'gaming', name: 'Gaming', icon: 'game-controller' },
  { id: 'talk', name: 'Talk', icon: 'chatbubbles' },
  { id: 'art', name: 'Art', icon: 'color-palette' },
  { id: 'fitness', name: 'Fitness', icon: 'fitness' },
  { id: 'cooking', name: 'Cooking', icon: 'restaurant' },
  { id: 'travel', name: 'Travel', icon: 'airplane' },
];

const DiscoveryScreen = ({ navigation }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const renderCategory = ({ item }) => {
    const isActive = item.id === activeCategory;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isActive && styles.categoryChipActive]}
        onPress={() => setActiveCategory(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.icon}
          size={16}
          color={isActive ? Theme.Colors.bg.primary : Theme.Colors.text.secondary}
        />
        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={22} color={Theme.Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Theme.Colors.text.tertiary} />
        <Text style={styles.searchPlaceholder}>Search streams, people, tags...</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      />

      <View style={styles.emptyState}>
        <Ionicons name="compass-outline" size={48} color={Theme.Colors.text.tertiary} />
        <Text style={styles.emptyTitle}>Explore Live Content</Text>
        <Text style={styles.emptySubtitle}>Select a category to discover amazing streams</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.Colors.bg.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Theme.Spacing.base, paddingTop: Theme.Spacing.lg, paddingBottom: Theme.Spacing.sm,
  },
  headerTitle: {
    color: Theme.Colors.text.primary, fontSize: Theme.Typography.sizes.xxl, fontWeight: '800',
  },
  filterButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.Colors.glass.medium,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.glass.border,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: Theme.Spacing.base, marginBottom: Theme.Spacing.base,
    backgroundColor: Theme.Colors.glass.medium, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Theme.BorderRadius.pill, borderWidth: 1, borderColor: Theme.Colors.glass.border,
  },
  searchPlaceholder: { color: Theme.Colors.text.tertiary, fontSize: Theme.Typography.sizes.sm },
  categoriesList: {
    paddingHorizontal: Theme.Spacing.base, paddingBottom: Theme.Spacing.base, gap: 8,
  },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.BorderRadius.pill,
    backgroundColor: Theme.Colors.glass.medium, borderWidth: 1, borderColor: Theme.Colors.glass.border,
  },
  categoryChipActive: {
    backgroundColor: Theme.Colors.neon.cyan, borderColor: Theme.Colors.neon.cyan,
  },
  categoryText: { color: Theme.Colors.text.secondary, fontSize: Theme.Typography.sizes.sm, fontWeight: '600' },
  categoryTextActive: { color: Theme.Colors.bg.primary },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40,
  },
  emptyTitle: {
    color: Theme.Colors.text.secondary, fontSize: Theme.Typography.sizes.lg, fontWeight: '600', marginTop: 16,
  },
  emptySubtitle: {
    color: Theme.Colors.text.tertiary, fontSize: Theme.Typography.sizes.sm, marginTop: 8, textAlign: 'center',
  },
});

export default DiscoveryScreen;
