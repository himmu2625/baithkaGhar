/**
 * Property Card Component
 * Displays property information in a card format
 */

import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import type { Property } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
}

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/property/${property._id}`);
    }
  };

  const imageUri = property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* Image */}
      <Image source={{ uri: imageUri }} style={styles.image} />

      {/* Featured Badge */}
      {property.featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>⭐ Featured</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Title & Location */}
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          📍 {property.location}
        </Text>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <View style={styles.amenities}>
            <Text style={styles.amenityText} numberOfLines={1}>
              {property.amenities.slice(0, 3).join(' • ')}
            </Text>
          </View>
        )}

        {/* Price & Rating */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{property.price.base}</Text>
            <Text style={styles.priceLabel}>/night</Text>
          </View>

          {property.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {property.rating.toFixed(1)}</Text>
              {property.reviewCount && property.reviewCount > 0 && (
                <Text style={styles.reviewCount}>({property.reviewCount})</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.border,
  },
  featuredBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  featuredText: {
    color: COLORS.textDark,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  location: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  amenities: {
    marginBottom: SPACING.sm,
  },
  amenityText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
});
