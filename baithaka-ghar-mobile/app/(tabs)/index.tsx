/**
 * Home Screen (Search & Discover)
 * Main property search and discovery interface
 */

import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { useFeaturedProperties, useSearchProperties } from '@/hooks/useProperties';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch featured properties or search results
  const { data: featuredData, isLoading: featuredLoading, refetch: refetchFeatured } = useFeaturedProperties();
  const { data: searchData, isLoading: searchLoading } = useSearchProperties(searchQuery);

  const isSearching = searchQuery.length > 0;
  const isLoading = isSearching ? searchLoading : featuredLoading;
  const properties = isSearching ? searchData?.data : featuredData?.data;

  const handleRefresh = () => {
    if (isSearching) {
      // Refetch search results
    } else {
      refetchFeatured();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Baithaka Ghar</Text>
      <Text style={styles.subtitle}>Find your perfect stay</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🏠</Text>
      <Text style={styles.emptyText}>
        {isSearching ? 'No properties found' : 'No properties available'}
      </Text>
      <Text style={styles.emptySubtext}>
        {isSearching ? 'Try a different search term' : 'Check back later for new listings'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={properties || []}
        ListHeaderComponent={
          <>
            {renderHeader()}
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by location, property name..."
              />
            </View>
          </>
        }
        renderItem={({ item }) => <PropertyCard property={item} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      {isLoading && !properties && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  searchContainer: {
    marginBottom: SPACING.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
