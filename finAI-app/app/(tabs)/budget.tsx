import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol, type IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

type Budget = {
  id: number;
  userId: string;
  category: string;
  amount: number;
  month: string;
  spent: number;
};

type CategoryStyle = {
  icon: IconSymbolName;
  color: string;
};

type CategoryStylesMap = {
  [key: string]: CategoryStyle;
};

// Category icons and colors mapping (matching transactions screen)
const CATEGORY_STYLES: CategoryStylesMap = {
  Food: { icon: 'cart.fill', color: '#FF6B6B' },
  Transportation: { icon: 'car.fill', color: '#4ECDC4' },
  Housing: { icon: 'house.fill', color: '#45B7D1' },
  Utilities: { icon: 'bolt.fill', color: '#96CEB4' },
  Entertainment: { icon: 'film.fill', color: '#D4A5A5' },
  Healthcare: { icon: 'heart.fill', color: '#FF9999' },
  Shopping: { icon: 'bag.fill', color: '#9B89B3' },
  Other: { icon: 'ellipsis.circle.fill', color: '#A0A0A0' }
};

const CATEGORIES = Object.keys(CATEGORY_STYLES);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const colorScheme = useColorScheme();

  useEffect(() => {
    loadBudgets();
  }, [currentMonth]);

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      
      // Get the auth token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        Alert.alert('Error', 'Please log in again');
        return;
      }

      console.log('Fetching budgets for month:', currentMonth);
      
      const response = await api.get(`/budgets/${currentMonth}`);
      console.log('Response status:', response.status);
      console.log('Budgets response:', JSON.stringify(response.data, null, 2));

      if (response.status === 401) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      if (!Array.isArray(response.data)) {
        console.error('Invalid response format:', response.data);
        Alert.alert('Error', 'Invalid data received from server');
        setBudgets([]);
        return;
      }

      setBudgets(response.data);
    } catch (error: any) {
      console.error('Error loading budgets:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      Alert.alert(
        'Error',
        'Failed to load budgets. ' +
        (error.response?.data?.message || error.message || 'Unknown error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudget = async () => {
    if (!selectedCategory || !budgetAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const amount = parseFloat(budgetAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      // Check if a budget for this category already exists in the current month
      const existingBudget = budgets.find(
        budget => budget.category === selectedCategory && budget.month === currentMonth
      );

      if (existingBudget) {
        Alert.alert(
          'Category Already Exists',
          `A budget for ${selectedCategory} already exists for this month. Would you like to update it instead?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Update',
              onPress: async () => {
                try {
                  await api.put(`/budgets/${existingBudget.id}`, {
                    category: selectedCategory,
                    amount,
                    month: currentMonth
                  });
                  await loadBudgets();
                  setModalVisible(false);
                  resetForm();
                } catch (error: any) {
                  console.error('Error updating budget:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                  });
                  Alert.alert(
                    'Error',
                    'Failed to update budget. ' +
                    (error.response?.data?.message || error.message || 'Unknown error')
                  );
                }
              }
            }
          ]
        );
        return;
      }

      const budgetData = {
        category: selectedCategory,
        amount,
        month: currentMonth
      };

      console.log('Saving budget:', budgetData);

      const response = await api.post('/budgets', budgetData);
      console.log('Save response:', response.data);

      await loadBudgets();
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving budget:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Check if it's a duplicate category error from the backend
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        Alert.alert(
          'Duplicate Category',
          'A budget for this category already exists for this month.'
        );
        return;
      }

      Alert.alert(
        'Error',
        'Failed to save budget. ' +
        (error.response?.data?.message || error.message || 'Unknown error')
      );
    }
  };

  const resetForm = () => {
    setSelectedCategory('');
    setBudgetAmount('');
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 90) return '#FF3B30'; // Red for >= 90%
    if (percentage >= 75) return '#FF9500'; // Orange for >= 75%
    return '#34C759'; // Green for < 75%
  };

  const showWarningIfNeeded = (spent: number, budget: number, category: string) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 90) {
      Alert.alert(
        'Budget Warning',
        `You've used ${percentage.toFixed(1)}% of your ${category} budget!`
      );
    }
  };

  const handleDelete = async (budgetId: number) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/budgets/${budgetId}`);
              await loadBudgets();
            } catch (error: any) {
              console.error('Error deleting budget:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
              });
              Alert.alert(
                'Error',
                'Failed to delete budget. ' +
                (error.response?.data?.message || error.message || 'Unknown error')
              );
            }
          },
        },
      ]
    );
  };

  const getTotalBudget = () => budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const getTotalSpent = () => budgets.reduce((sum, budget) => sum + budget.spent, 0);
  
  const getFormattedMonth = (dateString: string) => {
    const [year, month] = dateString.split('-');
    return `${MONTHS[parseInt(month) - 1]} ${year}`;
  };

  const MonthSelector = () => (
    <Animated.View 
      entering={FadeInDown.delay(200)}
      style={styles.monthSelector}
    >
      <Pressable
        style={styles.monthButton}
        onPress={() => navigateMonth('prev')}>
        <IconSymbol
          name="chevron.left.forwardslash.chevron.right"
          size={20}
          color={Colors[colorScheme ?? 'light'].text}
          style={{ transform: [{ rotate: '180deg' }] }}
        />
      </Pressable>
      <ThemedText style={styles.monthText}>
        {getFormattedMonth(currentMonth)}
      </ThemedText>
      <Pressable
        style={styles.monthButton}
        onPress={() => navigateMonth('next')}>
        <IconSymbol
          name="chevron.left.forwardslash.chevron.right"
          size={20}
          color={Colors[colorScheme ?? 'light'].text}
        />
      </Pressable>
    </Animated.View>
  );

  const BudgetSummary = () => {
    const totalBudget = getTotalBudget();
    const totalSpent = getTotalSpent();
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    return (
      <Animated.View
        entering={FadeInDown.delay(400)}
        style={styles.summaryContainer}
      >
        <LinearGradient
          colors={colorScheme === 'dark' ? 
            ['#1A1A1C', '#2C2C2E'] : 
            ['#FFFFFF', '#F2F2F7']
          }
          style={styles.summaryGradient}
        >
          <ThemedText style={styles.summaryTitle}>Monthly Overview</ThemedText>
          <ThemedView style={styles.summaryRow}>
            <ThemedView style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Total Budget</ThemedText>
              <ThemedText style={styles.summaryAmount}>${totalBudget.toFixed(2)}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Total Spent</ThemedText>
              <ThemedText style={[
                styles.summaryAmount,
                { color: getProgressColor(totalSpent, totalBudget) }
              ]}>${totalSpent.toFixed(2)}</ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={styles.summaryProgressContainer}>
            <ThemedView style={styles.summaryProgress}>
              <Animated.View
                style={[
                  styles.summaryProgressFill,
                  { 
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: getProgressColor(totalSpent, totalBudget)
                  }
                ]}
              />
            </ThemedView>
            <ThemedText style={styles.summaryPercentage}>
              {percentage.toFixed(1)}% used
            </ThemedText>
          </ThemedView>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderRightActions = (budgetId: number) => {
    return (
      <ThemedView style={styles.swipeActions}>
        <Pressable
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => handleDelete(budgetId)}>
          <IconSymbol
            name="xmark.circle.fill"
            size={24}
            color="#FFFFFF"
          />
          <ThemedText style={styles.swipeActionText}>Delete</ThemedText>
        </Pressable>
      </ThemedView>
    );
  };

  const renderBudgetItem = ({ item, index }: { item: Budget; index: number }) => {
    const percentage = Math.min((item.spent / item.amount) * 100, 100);
    const progressColor = getProgressColor(item.spent, item.amount);
    const categoryStyle = CATEGORY_STYLES[item.category as keyof typeof CATEGORY_STYLES];

    return (
      <Animated.View
        entering={FadeInRight.delay(index * 100)}
      >
        <Swipeable
          renderRightActions={() => renderRightActions(item.id)}
          friction={2}
          rightThreshold={40}
        >
          <Pressable
            style={({ pressed }) => [
              styles.budgetItem,
              pressed && styles.budgetItemPressed
            ]}
          >
            <LinearGradient
              colors={[
                colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
                colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF'
              ]}
              style={styles.budgetItemGradient}
            >
              <ThemedView style={styles.budgetItemHeader}>
                <ThemedView style={styles.categoryContainer}>
                  <ThemedView style={[styles.categoryIcon, { backgroundColor: categoryStyle.color + '20' }]}>
                    <IconSymbol
                      name={categoryStyle.icon}
                      size={24}
                      color={categoryStyle.color}
                    />
                  </ThemedView>
                  <ThemedText style={styles.categoryText}>{item.category}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.amountContainer}>
                  <ThemedText style={styles.spentText}>
                    ${item.spent.toFixed(2)}
                  </ThemedText>
                  <ThemedText style={styles.budgetText}>
                    / ${item.amount.toFixed(2)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.progressContainer}>
                <ThemedView style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { 
                        width: `${percentage}%`,
                        backgroundColor: progressColor
                      }
                    ]}
                  />
                </ThemedView>
                <ThemedText style={[styles.percentageText, { color: progressColor }]}>
                  {percentage.toFixed(1)}%
                </ThemedText>
              </ThemedView>
            </LinearGradient>
          </Pressable>
        </Swipeable>
      </Animated.View>
    );
  };

  const renderCategoryItem = ({ item }: { item: string }) => {
    const categoryStyle = CATEGORY_STYLES[item as keyof typeof CATEGORY_STYLES];
    
    return (
      <Pressable
        style={[
          styles.categoryItem,
          selectedCategory === item && styles.selectedCategory
        ]}
        onPress={() => setSelectedCategory(item)}>
        <ThemedView style={[
          styles.categoryIcon,
          { backgroundColor: categoryStyle.color + '20' }
        ]}>
          <IconSymbol
            name={categoryStyle.icon}
            size={24}
            color={categoryStyle.color}
          />
        </ThemedView>
        <ThemedText style={[
          styles.categoryItemText,
          selectedCategory === item && styles.selectedCategoryText
        ]}>
          {item}
        </ThemedText>
      </Pressable>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const date = new Date(currentMonth + '-01');
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <MonthSelector />
        <BudgetSummary />

        <Animated.View
          entering={FadeInDown.delay(600)}
          style={styles.listContainer}
        >
          <ThemedText style={styles.sectionTitle}>Category Budgets</ThemedText>
          <FlatList
            data={budgets}
            renderItem={renderBudgetItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                {isLoading ? 'Loading budgets...' : 'No budgets set for this month'}
              </ThemedText>
            }
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(800)}
        >
          <Pressable 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}>
            <IconSymbol
              name="plus.circle.fill"
              size={24}
              color="#FFFFFF"
            />
            <ThemedText style={styles.addButtonText}>
              Add Budget
            </ThemedText>
          </Pressable>
        </Animated.View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            resetForm();
          }}>
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Set Budget</ThemedText>

              <ThemedText style={styles.modalLabel}>Category</ThemedText>
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategoryItem}
                keyExtractor={item => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryList}
              />

              <ThemedText style={styles.modalLabel}>Amount</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#666"
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="decimal-pad"
              />

              <ThemedView style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}>
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveBudget}>
                  <ThemedText style={styles.modalButtonText}>Save</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Modal>
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 10,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 20,
  },
  summaryContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '600',
  },
  summaryProgressContainer: {
    marginTop: 10,
  },
  summaryProgress: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryPercentage: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'right',
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  budgetItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  budgetItemPressed: {
    opacity: 0.7,
  },
  budgetItemGradient: {
    padding: 16,
  },
  budgetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetText: {
    fontSize: 14,
    opacity: 0.6,
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A84FF',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  categoryList: {
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 15,
    opacity: 0.7,
  },
  selectedCategory: {
    opacity: 1,
  },
  categoryItemText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#0A84FF',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 20,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 10,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
    borderRadius: 16,
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
}); 