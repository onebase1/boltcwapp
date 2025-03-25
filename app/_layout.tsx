import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, SplashScreen } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from '@/contexts/auth';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if we already have a session
    const initializeApp = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData?.session);

        // Set up auth state listener
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('Auth state changed:', event);
          setSession(newSession);
          
          if (event === 'SIGNED_IN') {
            router.replace('/(tabs)');
          } else if (event === 'SIGNED_OUT') {
            router.replace('/sign-in');
          }
        });

        setInitialized(true);
        SplashScreen.hideAsync();
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitialized(true);
        SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  if (!initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.text}>Loading BoltCW...</Text>
      </View>
    );
  }

  return (
    <AuthProvider session={session}>
      <Slot />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});