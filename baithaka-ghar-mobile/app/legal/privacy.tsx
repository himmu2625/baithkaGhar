/**
 * Privacy Policy Screen
 * Legal information about data collection and usage
 */

import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: December 28, 2025</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to Baithaka Ghar ("we," "our," or "us"). We are committed to protecting your personal
          information and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
          and safeguard your information when you use our mobile application.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>

        <Text style={styles.subsectionTitle}>2.1 Personal Information</Text>
        <Text style={styles.paragraph}>
          When you register for an account, we collect:
        </Text>
        <Text style={styles.bulletPoint}>• Full name</Text>
        <Text style={styles.bulletPoint}>• Email address</Text>
        <Text style={styles.bulletPoint}>• Phone number</Text>
        <Text style={styles.bulletPoint}>• Profile picture (optional)</Text>

        <Text style={styles.subsectionTitle}>2.2 Booking Information</Text>
        <Text style={styles.paragraph}>
          When you make a booking, we collect:
        </Text>
        <Text style={styles.bulletPoint}>• Property preferences</Text>
        <Text style={styles.bulletPoint}>• Check-in and check-out dates</Text>
        <Text style={styles.bulletPoint}>• Number of guests</Text>
        <Text style={styles.bulletPoint}>• Special requests</Text>
        <Text style={styles.bulletPoint}>• Payment information (processed securely via Razorpay)</Text>

        <Text style={styles.subsectionTitle}>2.3 Automatically Collected Information</Text>
        <Text style={styles.paragraph}>
          We automatically collect certain information when you use our app:
        </Text>
        <Text style={styles.bulletPoint}>• Device information (model, OS version)</Text>
        <Text style={styles.bulletPoint}>• IP address</Text>
        <Text style={styles.bulletPoint}>• App usage data and analytics</Text>
        <Text style={styles.bulletPoint}>• Location data (with your permission)</Text>
        <Text style={styles.bulletPoint}>• Push notification tokens</Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to:
        </Text>
        <Text style={styles.bulletPoint}>• Create and manage your account</Text>
        <Text style={styles.bulletPoint}>• Process your bookings and payments</Text>
        <Text style={styles.bulletPoint}>• Send booking confirmations and updates</Text>
        <Text style={styles.bulletPoint}>• Provide customer support</Text>
        <Text style={styles.bulletPoint}>• Send push notifications about your bookings</Text>
        <Text style={styles.bulletPoint}>• Improve our services and user experience</Text>
        <Text style={styles.bulletPoint}>• Prevent fraud and ensure security</Text>
        <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>

        <Text style={styles.sectionTitle}>4. Information Sharing</Text>
        <Text style={styles.paragraph}>
          We may share your information with:
        </Text>
        <Text style={styles.bulletPoint}>
          • Property owners (for booking purposes)
        </Text>
        <Text style={styles.bulletPoint}>
          • Payment processors (Razorpay) for transaction processing
        </Text>
        <Text style={styles.bulletPoint}>
          • Service providers who assist in operating our app
        </Text>
        <Text style={styles.bulletPoint}>
          • Law enforcement when required by law
        </Text>
        <Text style={styles.paragraph}>
          We do NOT sell your personal information to third parties.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational security measures to protect your
          personal information, including:
        </Text>
        <Text style={styles.bulletPoint}>• Encryption of data in transit (HTTPS/TLS)</Text>
        <Text style={styles.bulletPoint}>• Secure storage using industry-standard encryption</Text>
        <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
        <Text style={styles.bulletPoint}>• Limited access to personal data by authorized personnel only</Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Access your personal information</Text>
        <Text style={styles.bulletPoint}>• Update or correct your information</Text>
        <Text style={styles.bulletPoint}>• Delete your account and associated data</Text>
        <Text style={styles.bulletPoint}>• Opt-out of marketing communications</Text>
        <Text style={styles.bulletPoint}>• Disable push notifications</Text>
        <Text style={styles.bulletPoint}>• Request a copy of your data</Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your personal information for as long as necessary to provide our services and
          comply with legal obligations. Booking information is retained for 7 years for accounting
          and legal purposes.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our app is not intended for children under 13 years of age. We do not knowingly collect
          personal information from children under 13.
        </Text>

        <Text style={styles.sectionTitle}>9. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Our app uses third-party services:
        </Text>
        <Text style={styles.bulletPoint}>• Razorpay (payment processing)</Text>
        <Text style={styles.bulletPoint}>• Expo Push Notifications (notifications)</Text>
        <Text style={styles.bulletPoint}>• Cloudinary (image storage)</Text>
        <Text style={styles.bulletPoint}>• Google Maps (location services)</Text>
        <Text style={styles.paragraph}>
          These services have their own privacy policies governing the use of your information.
        </Text>

        <Text style={styles.sectionTitle}>10. International Data Transfers</Text>
        <Text style={styles.paragraph}>
          Your information may be transferred to and processed in countries other than your country
          of residence. We ensure appropriate safeguards are in place to protect your data.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by
          posting the new Privacy Policy in the app and updating the "Last Updated" date.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy, please contact us at:
        </Text>
        <Text style={styles.bulletPoint}>Email: privacy@baithakaghar.com</Text>
        <Text style={styles.bulletPoint}>Phone: +977-9876543210</Text>
        <Text style={styles.bulletPoint}>Address: Kathmandu, Nepal</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Baithaka Ghar, you agree to this Privacy Policy.
          </Text>
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
    flex: 1,
    padding: SPACING.lg,
  },
  lastUpdated: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  subsectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  paragraph: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  bulletPoint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.md,
  },
  footer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    padding: SPACING.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
