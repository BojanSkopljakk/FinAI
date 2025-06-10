import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  
  const tabBarHeight = Platform.select({
    ios: 50,
    android: 60,
    default: 50,
  });

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: true,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: {
            position: 'absolute',
            bottom: insets.bottom + 10,
            left: 20,
            right: 20,
            height: tabBarHeight,
            borderRadius: 25,
            backgroundColor: Platform.select({
              ios: 'transparent',
              android: '#ffffff',
              default: '#ffffff',
            }),
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 5,
            },
            shadowOpacity: 0.15,
            shadowRadius: 10,
          },
          tabBarItemStyle: {
            paddingVertical: 5,
          },
          tabBarLabelStyle: {
            fontFamily: Platform.select({ ios: undefined, default: 'sans-serif-medium' }),
            fontSize: 12,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <IconSymbol 
                  size={28} 
                  name="house.fill" 
                  color={color} 
                  style={[
                    styles.tabIcon,
                    focused && styles.tabIconFocused
                  ]}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <IconSymbol 
                  size={28} 
                  name="dollarsign.circle.fill" 
                  color={color}
                  style={[
                    styles.tabIcon,
                    focused && styles.tabIconFocused
                  ]}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <IconSymbol 
                  size={28} 
                  name="chart.bar.fill" 
                  color={color}
                  style={[
                    styles.tabIcon,
                    focused && styles.tabIconFocused
                  ]}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: 'Budget',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <IconSymbol 
                  size={28} 
                  name="chart.pie.fill" 
                  color={color}
                  style={[
                    styles.tabIcon,
                    focused && styles.tabIconFocused
                  ]}
                />
              </View>
            ),
          }}
        />

<Tabs.Screen
  name="chat-assistant"
  options={{
    title: 'AI',
    tabBarIcon: ({ color, focused }) => (
      <View style={styles.tabIconContainer}>
        <IconSymbol
          size={28}
          name="brain.fill" // or brain/headphones etc.
          color={color}
          style={[
            styles.tabIcon,
            focused && styles.tabIconFocused
          ]}
        />
      </View>
    ),
  }}
/>

        
        <Tabs.Screen
          name="savings"
          options={{
            title: 'Savings',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <IconSymbol 
                  size={28} 
                  name="banknote.fill" 
                  color={color}
                  style={[
                    styles.tabIcon,
                    focused && styles.tabIconFocused
                  ]}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  tabIcon: {
    opacity: 0.8,
    transform: [{ scale: 1 }],
  },
  tabIconFocused: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
});
