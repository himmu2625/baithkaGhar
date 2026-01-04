/**
 * Terms and Conditions Screen
 * Legal terms of service for using the app
 */

import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

export default function TermsAndConditionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms & Conditions</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: December 28, 2025</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using the Baithaka Ghar mobile application ("App"), you accept and agree to
          be bound by these Terms and Conditions. If you do not agree to these terms, please do not
          use the App.
        </Text>

        <Text style={styles.sectionTitle}>2. User Accounts</Text>

        <Text style={styles.subsectionTitle}>2.1 Account Creation</Text>
        <Text style={styles.paragraph}>
          To use certain features of the App, you must create an account. You agree to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
        <Text style={styles.bulletPoint}>• Maintain the security of your account credentials</Text>
        <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized access</Text>
        <Text style={styles.bulletPoint}>• Be responsible for all activities under your account</Text>

        <Text style={styles.subsectionTitle}>2.2 Account Termination</Text>
        <Text style={styles.paragraph}>
          We reserve the right to suspend or terminate your account if you violate these terms or
          engage in fraudulent activity.
        </Text>

        <Text style={styles.sectionTitle}>3. Bookings and Reservations</Text>

        <Text style={styles.subsectionTitle}>3.1 Making Bookings</Text>
        <Text style={styles.paragraph}>
          When you make a booking through our App:
        </Text>
        <Text style={styles.bulletPoint}>
          • You enter into a direct contract with the property owner
        </Text>
        <Text style={styles.bulletPoint}>
          • Baithaka Ghar acts as an intermediary platform
        </Text>
        <Text style={styles.bulletPoint}>
          • You must comply with the property's rules and policies
        </Text>
        <Text style={styles.bulletPoint}>
          • You are responsible for providing accurate booking information
        </Text>

        <Text style={styles.subsectionTitle}>3.2 Pricing and Payment</Text>
        <Text style={styles.paragraph}>
          All prices are displayed in Indian Rupees (INR) unless otherwise specified. Prices include
          applicable taxes and fees. Payment is processed securely through Razorpay.
        </Text>

        <Text style={styles.subsectionTitle}>3.3 Cancellation Policy</Text>
        <Text style={styles.paragraph}>
          Cancellation policies vary by property. You can cancel bookings through the App according
          to the property's cancellation policy. Refunds, if applicable, will be processed within
          7-14 business days.
        </Text>

        <Text style={styles.sectionTitle}>4. User Conduct</Text>
        <Text style={styles.paragraph}>
          You agree not to:
        </Text>
        <Text style={styles.bulletPoint}>
          • Use the App for any illegal or unauthorized purpose
        </Text>
        <Text style={styles.bulletPoint}>
          • Violate any laws in your jurisdiction
        </Text>
        <Text style={styles.bulletPoint}>
          • Transmit any viruses or malicious code
        </Text>
        <Text style={styles.bulletPoint}>
          • Interfere with the security of the App
        </Text>
        <Text style={styles.bulletPoint}>
          • Impersonate any person or entity
        </Text>
        <Text style={styles.bulletPoint}>
          • Collect or harvest user data without permission
        </Text>
        <Text style={styles.bulletPoint}>
          • Post false, misleading, or fraudulent reviews
        </Text>

        <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The App and its original content, features, and functionality are owned by Baithaka Ghar
          and are protected by international copyright, trademark, and other intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>6. User-Generated Content</Text>

        <Text style={styles.subsectionTitle}>6.1 Reviews and Ratings</Text>
        <Text style={styles.paragraph}>
          When you post reviews or ratings:
        </Text>
        <Text style={styles.bulletPoint}>
          • You grant us a license to use, display, and distribute your content
        </Text>
        <Text style={styles.bulletPoint}>
          • You represent that the content is accurate and not defamatory
        </Text>
        <Text style={styles.bulletPoint}>
          • We reserve the right to remove inappropriate content
        </Text>

        <Text style={styles.subsectionTitle}>6.2 Photos and Images</Text>
        <Text style={styles.paragraph}>
          By uploading photos, you grant us a non-exclusive, worldwide license to use them for
          promotional purposes on our platform.
        </Text>

        <Text style={styles.sectionTitle}>7. Disclaimers</Text>

        <Text style={styles.subsectionTitle}>7.1 No Warranty</Text>
        <Text style={styles.paragraph}>
          THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
          We do not guarantee that the App will be error-free or uninterrupted.
        </Text>

        <Text style={styles.subsectionTitle}>7.2 Property Information</Text>
        <Text style={styles.paragraph}>
          While we strive to ensure accuracy, we cannot guarantee that all property information,
          including photos and descriptions, is completely accurate or up-to-date.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          Baithaka Ghar shall not be liable for any indirect, incidental, special, consequential, or
          punitive damages resulting from your use of or inability to use the App. Our total liability
          shall not exceed the amount you paid for the booking.
        </Text>

        <Text style={styles.sectionTitle}>9. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          The App integrates with third-party services including:
        </Text>
        <Text style={styles.bulletPoint}>• Razorpay (payment processing)</Text>
        <Text style={styles.bulletPoint}>• Google Maps (location services)</Text>
        <Text style={styles.bulletPoint}>• Cloud storage providers</Text>
        <Text style={styles.paragraph}>
          We are not responsible for the availability or performance of these third-party services.
        </Text>

        <Text style={styles.sectionTitle}>10. Indemnification</Text>
        <Text style={styles.paragraph}>
          You agree to indemnify and hold Baithaka Ghar harmless from any claims, damages, losses,
          or expenses arising from your use of the App or violation of these terms.
        </Text>

        <Text style={styles.sectionTitle}>11. Privacy</Text>
        <Text style={styles.paragraph}>
          Your use of the App is also governed by our Privacy Policy. Please review our Privacy
          Policy to understand our practices regarding your personal information.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these terms at any time. We will notify you of significant
          changes via the App or email. Continued use of the App after changes constitutes acceptance
          of the new terms.
        </Text>

        <Text style={styles.sectionTitle}>13. Governing Law</Text>
        <Text style={styles.paragraph}>
          These terms shall be governed by and construed in accordance with the laws of Nepal/India,
          without regard to its conflict of law provisions.
        </Text>

        <Text style={styles.sectionTitle}>14. Dispute Resolution</Text>
        <Text style={styles.paragraph}>
          Any disputes arising from these terms or your use of the App shall be resolved through
          binding arbitration in accordance with the rules of the jurisdiction.
        </Text>

        <Text style={styles.sectionTitle}>15. Contact Information</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms and Conditions, please contact us:
        </Text>
        <Text style={styles.bulletPoint}>Email: legal@baithakaghar.com</Text>
        <Text style={styles.bulletPoint}>Phone: +977-9876543210</Text>
        <Text style={styles.bulletPoint}>Address: Kathmandu, Nepal</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Baithaka Ghar, you acknowledge that you have read, understood, and agree to
            be bound by these Terms and Conditions.
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
    lineHeight: 20,
  },
});
