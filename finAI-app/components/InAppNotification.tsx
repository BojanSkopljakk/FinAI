import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Animated, Dimensions, Platform, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

type Notification = {
  id: number;
  userId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

export function InAppNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = async () => {
    const token = await AsyncStorage.getItem('token');
    setIsAuthenticated(!!token);
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get<Notification[]>('/notifications');
      
      if (response.data && Array.isArray(response.data)) {
        // Filter unread notifications and sort by creation date
        const unreadNotifications = response.data
          .filter(n => !n.isRead)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setNotifications(unreadNotifications);
        
        // If we have unread notifications and no current notification showing
        if (unreadNotifications.length > 0 && !currentNotification) {
          showNotification(unreadNotifications[0]);
        }
      }
    } catch (error: any) {
      // Only log errors that are not 401 (Unauthorized)
      if (error?.response?.status !== 401) {
        console.error('Failed to fetch notifications:', error);
      } else {
        setIsAuthenticated(false);
        await AsyncStorage.removeItem('token');
      }
    }
  };

  const showNotification = (notification: Notification) => {
    setCurrentNotification(notification);
    
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();

    // Auto hide after 3 seconds
    setTimeout(() => hideNotification(notification.id), 3000);
  };

  const hideNotification = async (notificationId: number) => {
    // Slide out animation
    Animated.spring(slideAnim, {
      toValue: -100,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start(async () => {
      if (!isAuthenticated) return;

      try {
        await api.put(`/notifications/${notificationId}/read`);
        setCurrentNotification(null);
        
        // Remove from notifications list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Show next notification if available
        const remainingNotifications = notifications.filter(n => n.id !== notificationId);
        if (remainingNotifications.length > 0) {
          setTimeout(() => {
            showNotification(remainingNotifications[0]);
          }, 500);
        }
      } catch (error: any) {
        // Only log errors that are not 401 (Unauthorized)
        if (error?.response?.status !== 401) {
          console.error('Failed to mark notification as read:', error);
        }
      }
    });
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch
      fetchNotifications();

      // Poll every 5 seconds
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!currentNotification) return null;

  const isBudgetNotification = currentNotification.message.toLowerCase().includes('budget');

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <ThemedView style={styles.notification}>
        <IconSymbol 
          name={isBudgetNotification ? 'chart.pie.fill' : 'banknote.fill'}
          size={24} 
          color={isBudgetNotification ? '#FF9500' : '#34C759'} 
        />
        <ThemedText style={styles.message}>
          {currentNotification.message}
        </ThemedText>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    pointerEvents: 'box-none',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxWidth: width - 32,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#000',
  },
}); 