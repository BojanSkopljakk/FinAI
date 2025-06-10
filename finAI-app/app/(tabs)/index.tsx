import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, GestureResponderEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import api from '@/lib/api';
import { useTransaction } from '../context/TransactionContext';

const { width } = Dimensions.get('window');

interface QuickActionProps {
  icon: 'plus.circle.fill' | 'minus.circle.fill' | 'chart.pie.fill' | 'banknote.fill';
  title: string;
  onPress: (event: GestureResponderEvent) => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, onPress }) => {
  const colorScheme = useColorScheme();
  
  return (
    <Pressable 
      style={styles.quickAction}
      onPress={onPress}
    >
      <LinearGradient
        colors={colorScheme === 'dark' ? 
          ['#2C2C2E', '#1C1C1E'] : 
          ['#F2F2F7', '#FFFFFF']
        }
        style={styles.quickActionGradient}
      >
        <IconSymbol
          name={icon}
          size={32}
          color={Colors[colorScheme ?? 'light'].tint}
        />
        <ThemedText style={styles.quickActionText}>{title}</ThemedText>
      </LinearGradient>
    </Pressable>
  );
};

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const { setShowNewTransactionModal, setNewTransactionType } = useTransaction();

  const loadBalance = async () => {
    try {
      // Get the current month in YYYY-MM format
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await api.get('/transactions');
      
      // Calculate balance from transactions for the current month
      const transactions = response.data;
      const monthlyBalance = transactions
        .filter((transaction: any) => transaction.date.startsWith(currentMonth))
        .reduce((sum: number, transaction: any) => {
          return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }, 0);
      
      setBalance(monthlyBalance);
    } catch (error: any) {
      console.error('Error loading balance:', error?.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data); // Assuming it's an array
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      
      // Get user email from storage
      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email);
      
      // Load the balance
      await loadBalance();
    };

    checkAuth();
  }, []);

  if (!userEmail) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.container}>
          {/* Hero Section */}
          <Animated.View 
            entering={FadeInDown.duration(600)}
            style={styles.heroSection}
          >
            <LinearGradient
              colors={colorScheme === 'dark' ? 
                ['#1A1A1C', '#2C2C2E'] : 
                ['#FFFFFF', '#F2F2F7']
              }
              style={styles.heroGradient}
            >
              <ThemedText type="defaultSemiBold" style={styles.welcomeText}>
                Welcome back, {userEmail?.split('@')[0]}
              </ThemedText>
              <ThemedText type="title" style={[
                styles.balanceText,
                { color: balance >= 0 ? '#34C759' : '#FF3B30' }
              ]}>
                {isLoading ? '...' : `$${Math.abs(balance).toFixed(2)}`}
              </ThemedText>
              <ThemedText style={styles.balanceLabel}>
                {isLoading ? 'Loading balance...' : `${balance >= 0 ? 'Available' : 'Negative'} Balance (This Month)`}
              </ThemedText>
            </LinearGradient>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View 
            entering={FadeInUp.duration(600).delay(200)}
            style={styles.section}
          >
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Quick Actions
            </ThemedText>
            <ThemedView style={styles.quickActionsGrid}>
              <QuickAction 
                icon="plus.circle.fill" 
                title="Add Income"
                onPress={() => {
                  setNewTransactionType('income');
                  setShowNewTransactionModal(true);
                  router.push('/(tabs)/transactions');
                }}
              />
              <QuickAction 
                icon="minus.circle.fill" 
                title="Add Expense"
                onPress={() => {
                  setNewTransactionType('expense');
                  setShowNewTransactionModal(true);
                  router.push('/(tabs)/transactions');
                }}
              />
              <QuickAction 
                icon="chart.pie.fill" 
                title="View Budget"
                onPress={() => router.push('/(tabs)/budget')}
              />
              <QuickAction 
                icon="banknote.fill" 
                title="Savings"
                onPress={() => router.push('/(tabs)/savings')}
              />
            </ThemedView>
          </Animated.View>

        {/* Recent Activity */}
<Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.section}>
  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
    Recent Activity
  </ThemedText>

  <ThemedView style={styles.activityList}>
    {transactions.length > 0 ? (
      transactions.slice(0, 5).map((transaction, index) => (
        <LinearGradient
          key={index}
          colors={[
            transaction.type === 'income' ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.transactionItem}
        >
          <View style={styles.iconContainer}>
            <IconSymbol
              name={transaction.type === 'income' ? 'arrow.up.circle.fill' : 'arrow.down.circle.fill'}
              size={20}
              color={transaction.type === 'income' ? '#34C759' : '#FF3B30'}
            />
          </View>
          <View style={styles.transactionTextContainer}>
            <ThemedText style={styles.transactionText}>
              {transaction.category}
            </ThemedText>
            <ThemedText
              style={[
                styles.transactionAmount,
                {
                  color: transaction.type === 'income' ? '#34C759' : '#FF3B30',
                },
              ]}
            >
              {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
            </ThemedText>
          </View>
        </LinearGradient>
      ))
    ) : (
      <ThemedText style={styles.emptyText}>No recent activity</ThemedText>
    )}
  </ThemedView>
</Animated.View>


          {/* Financial Summary */}
          <Animated.View 
            entering={FadeInUp.duration(600).delay(600)}
            style={styles.section}
          >
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Financial Summary
            </ThemedText>
            <ThemedView style={styles.summaryGrid}>
              {/* Add your summary cards here */}
            </ThemedView>
          </Animated.View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 24,
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: (width - 52) / 2,
    aspectRatio: 1.5,
  },
  quickActionGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
 /* activityList: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },*/
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityList: {
    gap: 12,
  },
  
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  transactionTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  transactionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  
});
