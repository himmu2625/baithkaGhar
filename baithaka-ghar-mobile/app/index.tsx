/**
 * Index Screen (Welcome/Splash)
 * Entry point that redirects to auth or main app
 */

import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { authService } from '@/services';
import { COLORS } from '@/constants';

export default function Index() {
  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const isAuth = await authService.isAuthenticated();

      // Small delay for splash screen effect
      setTimeout(() => {
        if (isAuth) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/welcome');
        }
      }, 1000);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/(auth)/welcome');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Baithaka Ghar</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});
