/**
 * Booking Success Screen
 * Shows successful booking confirmation after payment
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBooking } from '@/hooks/useBookings';
import { notificationService } from '@/services';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import { format } from 'date-fns';

export default function BookingSuccessScreen() {
  const { bookingId, paymentId } = useLocalSearchParams<{ bookingId: string; paymentId: string }>();
  const { data, isLoading } = useBooking(bookingId);
  const booking = data?.data;

  // Send notification and schedule reminder when booking loads
  useEffect(() => {
    if (booking) {
      // Send booking confirmation notification
      notificationService.sendBookingConfirmation(
        booking._id,
        booking.propertyId.title || 'Property',
        booking.checkIn
      );

      // Schedule check-in reminder (24 hours before)
      notificationService.scheduleCheckInReminder(
        booking._id,
        booking.propertyId.title || 'Property',
        new Date(booking.checkIn)
      );
    }
  }, [booking]);

  if (isLoading || !booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading booking details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your payment has been processed successfully
        </Text>

        {/* Booking Reference */}
        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Booking Reference</Text>
          <Text style={styles.referenceValue}>{booking.bookingReference}</Text>
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment ID</Text>
            <Text style={styles.detailValue}>{paymentId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>₹{booking.totalPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Status</Text>
            <View style={[styles.statusBadge, styles.statusSuccess]}>
              <Text style={styles.statusText}>Paid</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-in</Text>
            <Text style={styles.detailValue}>
              {format(new Date(booking.checkIn), 'MMM dd, yyyy')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-out</Text>
            <Text style={styles.detailValue}>
              {format(new Date(booking.checkOut), 'MMM dd, yyyy')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guests</Text>
            <Text style={styles.detailValue}>{booking.guests} guests</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rooms</Text>
            <Text style={styles.detailValue}>{booking.rooms} rooms</Text>
          </View>
        </View>

        {/* Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            📧 A confirmation email has been sent to {booking.guestDetails.email}
          </Text>
          <Text style={styles.infoText}>
            📱 You can view and manage your booking in the Bookings tab
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push(`/booking/details/${bookingId}`)}
        >
          <Text style={styles.primaryButtonText}>View Booking Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(tabs)/bookings')}
        >
          <Text style={styles.secondaryButtonText}>Go to My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tertiaryButton}
          onPress={() => router.push('/(tabs)/')}
        >
          <Text style={styles.tertiaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  successIcon: {
    fontSize: 60,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  referenceCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: SPACING.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  referenceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  referenceValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '100%',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: COLORS.textDark,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: SPACING.md,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    width: '100%',
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    color: COLORS.textDark,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '100%',
    marginBottom: SPACING.md,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  tertiaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  tertiaryButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
});
