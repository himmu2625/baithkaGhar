/**
 * Booking Card Component
 * Displays booking information in a card format
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { format } from 'date-fns';
import type { Booking } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/booking/details/${booking._id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'cancelled':
        return COLORS.error;
      case 'completed':
        return COLORS.textLight;
      default:
        return COLORS.text;
    }
  };

  const getStatusBadge = (status: string) => {
    return {
      backgroundColor: `${getStatusColor(status)}20`,
      color: getStatusColor(status),
    };
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.bookingId}>#{booking.bookingReference}</Text>
          <View style={[styles.statusBadge, getStatusBadge(booking.status)]}>
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.price}>₹{booking.totalPrice}</Text>
      </View>

      {/* Dates */}
      <View style={styles.dates}>
        <View style={styles.dateColumn}>
          <Text style={styles.dateLabel}>Check-in</Text>
          <Text style={styles.dateValue}>{format(new Date(booking.checkIn), 'MMM dd')}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.dateColumn}>
          <Text style={styles.dateLabel}>Check-out</Text>
          <Text style={styles.dateValue}>{format(new Date(booking.checkOut), 'MMM dd')}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.detailText}>
          {booking.guests} guest{booking.guests > 1 ? 's' : ''} • {booking.rooms} room
          {booking.rooms > 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  bookingId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  price: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  dates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs / 2,
  },
  dateValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  arrow: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textLight,
    marginHorizontal: SPACING.md,
  },
  details: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
});
