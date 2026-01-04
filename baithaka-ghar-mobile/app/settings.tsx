/**
 * Settings Screen
 * App preferences and configuration
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storage } from '@/services';
import { COLORS, SPACING, FONT_SIZES, STORAGE_KEYS } from '@/constants';

type Language = 'en' | 'ne' | 'hi';
type Currency = 'INR' | 'NPR' | 'USD';
type Theme = 'light' | 'dark' | 'auto';

export default function SettingsScreen() {
  // Notification Settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);

  // App Settings
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load notification settings
      const pushEnabled = await storage.getItem('push_notifications');
      const emailEnabled = await storage.getItem('email_notifications');
      const remindersEnabled = await storage.getItem('booking_reminders');
      const promoEnabled = await storage.getItem('promotional_emails');

      if (pushEnabled !== null) setPushNotifications(pushEnabled === 'true');
      if (emailEnabled !== null) setEmailNotifications(emailEnabled === 'true');
      if (remindersEnabled !== null) setBookingReminders(remindersEnabled === 'true');
      if (promoEnabled !== null) setPromotionalEmails(promoEnabled === 'true');

      // Load app settings
      const savedLanguage = await storage.getItem('language');
      const savedCurrency = await storage.getItem('currency');
      const savedTheme = await storage.getItem('theme');

      if (savedLanguage) setLanguage(savedLanguage as Language);
      if (savedCurrency) setCurrency(savedCurrency as Currency);
      if (savedTheme) setTheme(savedTheme as Theme);
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const saveNotificationSetting = async (key: string, value: boolean) => {
    try {
      await storage.setItem(key, value.toString());
    } catch (error) {
      console.error('Save setting error:', error);
    }
  };

  const handlePushNotificationsChange = (value: boolean) => {
    setPushNotifications(value);
    saveNotificationSetting('push_notifications', value);
  };

  const handleEmailNotificationsChange = (value: boolean) => {
    setEmailNotifications(value);
    saveNotificationSetting('email_notifications', value);
  };

  const handleBookingRemindersChange = (value: boolean) => {
    setBookingReminders(value);
    saveNotificationSetting('booking_reminders', value);
  };

  const handlePromotionalEmailsChange = (value: boolean) => {
    setPromotionalEmails(value);
    saveNotificationSetting('promotional_emails', value);
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    setLanguage(newLanguage);
    await storage.setItem('language', newLanguage);
    Alert.alert('Language Changed', `Language set to ${getLanguageName(newLanguage)}`);
  };

  const handleCurrencyChange = async (newCurrency: Currency) => {
    setCurrency(newCurrency);
    await storage.setItem('currency', newCurrency);
    Alert.alert('Currency Changed', `Currency set to ${newCurrency}`);
  };

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    await storage.setItem('theme', newTheme);
    Alert.alert('Theme Changed', `Theme set to ${getThemeName(newTheme)}`);
  };

  const getLanguageName = (lang: Language): string => {
    const names = { en: 'English', ne: 'नेपाली', hi: 'हिन्दी' };
    return names[lang];
  };

  const getThemeName = (t: Theme): string => {
    const names = { light: 'Light', dark: 'Dark', auto: 'Auto (System)' };
    return names[t];
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.content}>
          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive booking updates and reminders
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={handlePushNotificationsChange}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive booking confirmations via email
                </Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={handleEmailNotificationsChange}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Booking Reminders</Text>
                <Text style={styles.settingDescription}>
                  Get reminded before check-in
                </Text>
              </View>
              <Switch
                value={bookingReminders}
                onValueChange={handleBookingRemindersChange}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Promotional Emails</Text>
                <Text style={styles.settingDescription}>
                  Receive special offers and deals
                </Text>
              </View>
              <Switch
                value={promotionalEmails}
                onValueChange={handlePromotionalEmailsChange}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>
          </View>

          {/* Language Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language</Text>

            <TouchableOpacity
              style={[styles.optionItem, language === 'en' && styles.optionItemSelected]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={styles.optionText}>English</Text>
              {language === 'en' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, language === 'ne' && styles.optionItemSelected]}
              onPress={() => handleLanguageChange('ne')}
            >
              <Text style={styles.optionText}>नेपाली (Nepali)</Text>
              {language === 'ne' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, language === 'hi' && styles.optionItemSelected]}
              onPress={() => handleLanguageChange('hi')}
            >
              <Text style={styles.optionText}>हिन्दी (Hindi)</Text>
              {language === 'hi' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </View>

          {/* Currency Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Currency</Text>

            <TouchableOpacity
              style={[styles.optionItem, currency === 'INR' && styles.optionItemSelected]}
              onPress={() => handleCurrencyChange('INR')}
            >
              <Text style={styles.optionText}>₹ INR (Indian Rupee)</Text>
              {currency === 'INR' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, currency === 'NPR' && styles.optionItemSelected]}
              onPress={() => handleCurrencyChange('NPR')}
            >
              <Text style={styles.optionText}>रू NPR (Nepali Rupee)</Text>
              {currency === 'NPR' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, currency === 'USD' && styles.optionItemSelected]}
              onPress={() => handleCurrencyChange('USD')}
            >
              <Text style={styles.optionText}>$ USD (US Dollar)</Text>
              {currency === 'USD' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </View>

          {/* Theme Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>

            <TouchableOpacity
              style={[styles.optionItem, theme === 'light' && styles.optionItemSelected]}
              onPress={() => handleThemeChange('light')}
            >
              <Text style={styles.optionText}>☀️ Light Mode</Text>
              {theme === 'light' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, theme === 'dark' && styles.optionItemSelected]}
              onPress={() => handleThemeChange('dark')}
            >
              <Text style={styles.optionText}>🌙 Dark Mode</Text>
              {theme === 'dark' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, theme === 'auto' && styles.optionItemSelected]}
              onPress={() => handleThemeChange('auto')}
            >
              <Text style={styles.optionText}>🔄 Auto (System)</Text>
              {theme === 'auto' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </View>

          {/* Data & Storage Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data & Storage</Text>

            <TouchableOpacity style={styles.actionItem} onPress={clearCache}>
              <Text style={styles.actionText}>Clear Cache</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              💡 Changes to language and currency will take effect immediately
            </Text>
            <Text style={styles.infoText}>
              🔔 Notification settings apply to future bookings
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  optionItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f5f5f5',
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  checkmark: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textLight,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
});
