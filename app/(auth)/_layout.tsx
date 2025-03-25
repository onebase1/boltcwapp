import React, { useEffect } from 'react';
import { Slot, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      // If user is already logged in, redirect to the main app
      router.replace('/(tabs)');
    }
  }, [session, loading]);

  // Don't render anything while checking authentication status
  if (loading) {
    return null;
  }

  // If not authenticated, show the auth screens
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
