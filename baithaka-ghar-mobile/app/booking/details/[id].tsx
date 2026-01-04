/**
 * Booking Detail Screen
 * Complete booking information and actions
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useBooking, useCancelBooking } from '@/hooks/useBookings';
import { invoiceService } from '@/services';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useBooking(id);
  const cancelBooking = useCancelBooking();
  const booking = data?.data;

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
  const canReview = booking.status === 'completed';

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking.mutateAsync({ id: booking._id });
              Alert.alert('Success', 'Booking cancelled successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleContactProperty = () => {
    if (booking.guestDetails.phone) {
      Linking.openURL(`tel:${booking.guestDetails.phone}`);
    } else {
      Alert.alert('Info', 'Phone number not available');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      Alert.alert('Generating Invoice', 'Please wait...');
      await invoiceService.downloadInvoice(booking);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to download invoice');
    }
  };

  const handleLeaveReview = () => {
    router.push(`/review/${booking.propertyId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Booking Details</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Booking Reference */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Reference</Text>
            <Text style={styles.referenceText}>#{booking.bookingReference}</Text>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stay Dates</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>
                  {format(new Date(booking.checkIn), 'EEEE, MMM dd, yyyy')}
                </Text>
                <Text style={styles.dateTime}>After 2:00 PM</Text>
              </View>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>
                  {format(new Date(booking.checkOut), 'EEEE, MMM dd, yyyy')}
                </Text>
                <Text style={styles.dateTime}>Before 11:00 AM</Text>
              </View>
            </View>
          </View>

          {/* Guest Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{booking.guestDetails.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{booking.guestDetails.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{booking.guestDetails.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Guests:</Text>
              <Text style={styles.infoValue}>{booking.guests}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rooms:</Text>
              <Text style={styles.infoValue}>{booking.rooms}</Text>
            </View>
            {booking.specialRequests && (
              <View style={styles.requestsBox}>
                <Text style={styles.requestsLabel}>Special Requests:</Text>
                <Text style={styles.requestsText}>{booking.specialRequests}</Text>
              </View>
            )}
          </View>

          {/* Payment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total Amount</Text>
                <Text style={styles.priceValue}>₹{booking.totalPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Payment Status</Text>
                <Text style={[styles.priceValue, { color: getStatusColor(booking.paymentStatus) }]}>
                  {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleContactProperty}>
              <Text style={styles.actionButtonText}>📞 Call Property</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/messages/${booking.propertyId}`)}
            >
              <Text style={styles.actionButtonText}>💬 Send Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDownloadInvoice}>
              <Text style={styles.actionButtonText}>📄 Download Invoice</Text>
            </TouchableOpacity>

            {canReview && (
              <TouchableOpacity style={styles.reviewButton} onPress={handleLeaveReview}>
                <Text style={styles.reviewButtonText}>⭐ Leave a Review</Text>
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelBooking}
                disabled={cancelBooking.isPending}
              >
                <Text style={styles.cancelButtonText}>
                  {cancelBooking.isPending ? 'Cancelling...' : '❌ Cancel Booking'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Booking Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              Booked on {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    marginBottom: SPACING.lg,
  },
  backButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  backButtonText: {
    color: COLORS.textDark,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBackButton: {
    marginBottom: SPACING.sm,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  referenceText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  dateRow: {
    gap: SPACING.md,
  },
  dateColumn: {
    marginBottom: SPACING.md,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  dateValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  dateTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  requestsBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  requestsLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  requestsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  priceCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  priceValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  actions: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: COLORS.textDark,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textDark,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  infoBox: {
    padding: SPACING.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  infoBoxText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
});
