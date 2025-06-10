import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
};

export default function ChatAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
    };

    setMessages([...messages, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + '-ai',
          sender: 'ai',
          text: 'I see! Let me analyze that for you. 💡',
        },
      ]);
    }, 500);

    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80} // adjust if needed for header height
    >
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>AI Chat Assistant</ThemedText>
  
          <FlatList
  data={messages}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <ThemedText
        style={[
          styles.messageText,
          item.sender === 'ai' && styles.aiBubbleText,
        ]}
      >
        {item.text}
      </ThemedText>
    </View>
  )}
  contentContainerStyle={styles.messagesContainer}
  keyboardShouldPersistTaps="handled"
  style={{ flex: 1 }}
/>


  
          <View style={styles.inputContainer}>
          <TextInput
  style={styles.input}
  placeholder="Ask something about your finances..."
  value={input}
  onChangeText={setInput}
  multiline
  textAlignVertical="top"
/>

            <Pressable style={styles.sendButton} onPress={sendMessage}>
              <IconSymbol name="arrow.up.circle.fill" size={24} color="#fff" />
            </Pressable>
          </View>
        </ThemedView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
  
  
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 10 },
  messagesContainer: {
    paddingBottom: 120,
    paddingTop: 10,
    gap: 6,
  },
  
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginVertical: 6,
    marginHorizontal: 10,
    maxWidth: '75%',
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  userBubble: {
    backgroundColor: '#0A84FF',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#e5e5ea',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    flexShrink: 1, // ensures wrapping
    flexWrap: 'wrap',
  },
  aiBubbleText: {
    color: '#000',
  },
  
  
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    margin: 16,
    minHeight: 50, // ✅ taller input bar
    elevation: 5,
  },
  
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120, // optional: for multi-line expansion
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 10,
    color: '#000',
  },
  
  
  sendButton: {
    backgroundColor: '#0A84FF',
    padding: 10,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
});
