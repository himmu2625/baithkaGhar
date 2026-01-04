/**
 * Date Range Picker Component
 * Select check-in and check-out dates
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInPress: () => void;
  onCheckOutPress: () => void;
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInPress,
  onCheckOutPress,
}: DateRangePickerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dateCard}>
        <TouchableOpacity style={styles.dateButton} onPress={onCheckInPress}>
          <Text style={styles.label}>Check-in</Text>
          <Text style={styles.date}>
            {checkIn ? format(checkIn, 'MMM dd, yyyy') : 'Select date'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <Text style={styles.arrow}>→</Text>
      </View>

      <View style={styles.dateCard}>
        <TouchableOpacity style={styles.dateButton} onPress={onCheckOutPress}>
          <Text style={styles.label}>Check-out</Text>
          <Text style={styles.date}>
            {checkOut ? format(checkOut, 'MMM dd, yyyy') : 'Select date'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  dateButton: {
    padding: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  date: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textLight,
  },
});
