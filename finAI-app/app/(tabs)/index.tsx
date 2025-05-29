import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      
      // Get user email from storage (you might want to store this during login)
      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email);
    };

    checkAuth();
  }, []);

  if (!userEmail) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Welcome{userEmail ? `, ${userEmail}` : ''}!
        </ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          {/* Add your quick action buttons or cards here */}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Recent Activity
          </ThemedText>
          {/* Add your recent activity list here */}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Summary
          </ThemedText>
          {/* Add your summary content here */}
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    marginTop: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
});
