/**
 * Booking Screen
 * Complete booking flow for a property
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateRangePicker } from '@/components/DateRangePicker';
import { GuestSelector } from '@/components/GuestSelector';
import { useProperty } from '@/hooks/useProperties';
import { useCreateBooking } from '@/hooks/useBookings';
import { bookingService, paymentService, authService } from '@/services';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

export default function BookingScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { data } = useProperty(propertyId);
  const property = data?.data;

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const createBooking = useCreateBooking();

  if (!property) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading property...</Text>
      </View>
    );
  }

  const nights =
    checkIn && checkOut ? bookingService.calculateNights(checkIn.toISOString(), checkOut.toISOString()) : 0;

  const basePrice = property.price.base * nights * rooms;
  const cleaning = property.price.cleaning || 0;
  const service = property.price.service || 0;
  const taxAmount = ((basePrice + cleaning + service) * (property.price.tax || 0)) / 100;
  const totalPrice = basePrice + cleaning + service + taxAmount;

  const handleCheckInChange = (event: any, selectedDate?: Date) => {
    setShowCheckInPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCheckIn(selectedDate);
      // Auto-set checkout to next day if not set
      if (!checkOut) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOut(nextDay);
      }
    }
  };

  const handleCheckOutChange = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCheckOut(selectedDate);
    }
  };

  const handleBooking = async () => {
    // Validation
    if (!checkIn || !checkOut) {
      Alert.alert('Error', 'Please select check-in and check-out dates');
      return;
    }

    if (!guestName || !guestEmail || !guestPhone) {
      Alert.alert('Error', 'Please fill in all guest details');
      return;
    }

    if (nights < 1) {
      Alert.alert('Error', 'Check-out must be after check-in');
      return;
    }

    try {
      // Step 1: Create booking first (with pending status)
      const bookingData = {
        propertyId,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests,
        rooms,
        totalPrice,
        guestDetails: {
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
        },
        specialRequests,
        paymentStatus: 'pending',
      };

      const bookingResponse = await createBooking.mutateAsync(bookingData);

      if (!bookingResponse.success || !bookingResponse.data) {
        Alert.alert('Error', bookingResponse.message || 'Failed to create booking');
        return;
      }

      const booking = bookingResponse.data;

      // Step 2: Get current user for payment
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        return;
      }

      // Step 3: Process payment via Razorpay
      const paymentResult = await paymentService.processPayment({
        amount: totalPrice,
        bookingId: booking._id,
        propertyName: property.title,
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phone || guestPhone,
      });

      if (!paymentResult.success) {
        Alert.alert(
          'Payment Failed',
          paymentResult.error || 'Payment was not completed. Your booking is saved but not confirmed.',
          [
            {
              text: 'View Booking',
              onPress: () => router.push(`/booking/details/${booking._id}`),
            },
            { text: 'OK' },
          ]
        );
        return;
      }

      // Step 4: Verify payment on backend
      if (paymentResult.paymentId && paymentResult.orderId && paymentResult.signature) {
        const verifyResult = await paymentService.verifyPayment(
          paymentResult.paymentId,
          paymentResult.orderId,
          paymentResult.signature,
          booking._id
        );

        if (verifyResult.verified) {
          // Navigate to success screen
          router.push({
            pathname: '/booking/success',
            params: {
              bookingId: booking._id,
              paymentId: paymentResult.paymentId,
            },
          });
        } else {
          Alert.alert('Error', 'Payment verification failed. Please contact support.');
        }
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      Alert.alert('Error', error.message || 'An error occurred during booking');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Book Property</Text>
          <Text style={styles.propertyName}>{property.title}</Text>
        </View>

        <View style={styles.content}>
          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Dates</Text>
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInPress={() => setShowCheckInPicker(true)}
              onCheckOutPress={() => setShowCheckOutPicker(true)}
            />
            {nights > 0 && (
              <Text style={styles.nightsText}>{nights} night{nights > 1 ? 's' : ''}</Text>
            )}
          </View>

          {/* Guests & Rooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guests & Rooms</Text>
            <GuestSelector
              guests={guests}
              rooms={rooms}
              onGuestsChange={setGuests}
              onRoomsChange={setRooms}
            />
          </View>

          {/* Guest Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={guestName}
                onChangeText={setGuestName}
                placeholder="Enter your full name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={guestEmail}
                onChangeText={setGuestEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={guestPhone}
                onChangeText={setGuestPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Special Requests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              placeholder="Any special requests or requirements?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceCard}>
            <Text style={styles.priceTitle}>Price Breakdown</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                ₹{property.price.base} × {nights} nights × {rooms} rooms
              </Text>
              <Text style={styles.priceValue}>₹{basePrice.toFixed(2)}</Text>
            </View>
            {cleaning > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Cleaning fee</Text>
                <Text style={styles.priceValue}>₹{cleaning.toFixed(2)}</Text>
              </View>
            )}
            {service > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Service fee</Text>
                <Text style={styles.priceValue}>₹{service.toFixed(2)}</Text>
              </View>
            )}
            {taxAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes ({property.price.tax}%)</Text>
                <Text style={styles.priceValue}>₹{taxAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.separator} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{totalPrice.toFixed(2)}</Text>
            </View>
          </View>

          {/* Book Button */}
          <TouchableOpacity
            style={[styles.bookButton, createBooking.isPending && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={createBooking.isPending || nights < 1}
          >
            <Text style={styles.bookButtonText}>
              {createBooking.isPending ? 'Processing...' : `Confirm & Pay ₹${totalPrice.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Pickers (Android/iOS native) */}
      {showCheckInPicker && (
        <DateTimePicker
          value={checkIn || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleCheckInChange}
        />
      )}
      {showCheckOutPicker && (
        <DateTimePicker
          value={checkOut || (checkIn ? new Date(checkIn.getTime() + 86400000) : new Date())}
          mode="date"
          display="default"
          minimumDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
          onChange={handleCheckOutChange}
        />
      )}
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
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
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
    marginBottom: SPACING.xs,
  },
  propertyName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
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
  nightsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.background,
  },
  textArea: {
    height: 100,
  },
  priceCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  priceTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  priceValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: COLORS.textDark,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
});
