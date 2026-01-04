/**
 * Guest Selector Component
 * Select number of guests and rooms
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

interface GuestSelectorProps {
  guests: number;
  rooms: number;
  onGuestsChange: (value: number) => void;
  onRoomsChange: (value: number) => void;
  maxGuests?: number;
  maxRooms?: number;
}

export function GuestSelector({
  guests,
  rooms,
  onGuestsChange,
  onRoomsChange,
  maxGuests = 20,
  maxRooms = 10,
}: GuestSelectorProps) {
  return (
    <View style={styles.container}>
      {/* Guests */}
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.label}>Guests</Text>
          <Text style={styles.subtitle}>Number of people</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, guests <= 1 && styles.buttonDisabled]}
            onPress={() => guests > 1 && onGuestsChange(guests - 1)}
            disabled={guests <= 1}
          >
            <Text style={[styles.buttonText, guests <= 1 && styles.buttonTextDisabled]}>
              -
            </Text>
          </TouchableOpacity>
          <Text style={styles.value}>{guests}</Text>
          <TouchableOpacity
            style={[styles.button, guests >= maxGuests && styles.buttonDisabled]}
            onPress={() => guests < maxGuests && onGuestsChange(guests + 1)}
            disabled={guests >= maxGuests}
          >
            <Text
              style={[styles.buttonText, guests >= maxGuests && styles.buttonTextDisabled]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.separator} />

      {/* Rooms */}
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.label}>Rooms</Text>
          <Text style={styles.subtitle}>Number of rooms</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, rooms <= 1 && styles.buttonDisabled]}
            onPress={() => rooms > 1 && onRoomsChange(rooms - 1)}
            disabled={rooms <= 1}
          >
            <Text style={[styles.buttonText, rooms <= 1 && styles.buttonTextDisabled]}>
              -
            </Text>
          </TouchableOpacity>
          <Text style={styles.value}>{rooms}</Text>
          <TouchableOpacity
            style={[styles.button, rooms >= maxRooms && styles.buttonDisabled]}
            onPress={() => rooms < maxRooms && onRoomsChange(rooms + 1)}
            disabled={rooms >= maxRooms}
          >
            <Text style={[styles.buttonText, rooms >= maxRooms && styles.buttonTextDisabled]}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  buttonTextDisabled: {
    color: COLORS.textLight,
  },
  value: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 30,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
});
