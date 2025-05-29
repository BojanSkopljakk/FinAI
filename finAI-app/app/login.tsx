import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import api from '@/lib/api'; // Adjust path if needed
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
  
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
  
      const token = response.data.token;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userEmail', email);
  
      Alert.alert('Success', 'Logged in successfully!', [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error: any) {
      console.error('Login error:', error?.response?.data || error.message);
      Alert.alert('Login failed', error?.response?.data?.message || 'Invalid credentials');
    }
  };
  

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
        />

        <Pressable 
          style={styles.button}
          onPress={handleLogin}>
          <ThemedText style={styles.buttonText}>Login</ThemedText>
        </Pressable>

        <ThemedText 
          style={styles.registerLink}
          onPress={() => router.push('/register')}>
          Don't have an account? Register
        </ThemedText>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 30,
    fontSize: 24,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0A84FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    color: '#0A84FF',
  },
});
