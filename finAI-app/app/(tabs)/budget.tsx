import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import api from '@/lib/api';

type Budget = {
  id: number;
  userId: string;
  category: string;
  amount: number;
  month: string;
  spent: number;
};

const CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Other'
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

  const renderBudgetItem = ({ item }: { item: Budget }) => {
    const percentage = Math.min((item.spent / item.amount) * 100, 100);
    const progressColor = getProgressColor(item.spent, item.amount);

    return (
      <Pressable
        onLongPress={() => handleDelete(item.id)}
        style={({ pressed }) => [
          styles.budgetItem,
          pressed && styles.budgetItemPressed
        ]}>
        <ThemedView style={styles.budgetHeader}>
          <ThemedText style={styles.categoryText}>{item.category}</ThemedText>
          <ThemedText style={styles.amountText}>
            ${item.spent.toFixed(2)} / ${item.amount.toFixed(2)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.progressBarContainer}>
          <ThemedView 
            style={[
              styles.progressBar, 
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

        {percentage >= 90 && (
          <ThemedText style={styles.warningText}>
            Warning: Budget nearly exceeded!
          </ThemedText>
        )}

        <ThemedText style={styles.deleteHint}>
          Long press to delete
        </ThemedText>
      </Pressable>
    );
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <Pressable
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(item)}>
      <ThemedText style={[
        styles.categoryItemText,
        selectedCategory === item && styles.selectedCategoryText
      ]}>
        {item}
      </ThemedText>
    </Pressable>
  );

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
        <ThemedText type="title" style={styles.title}>Budget</ThemedText>

        <ThemedView style={styles.monthSelector}>
          <Pressable onPress={() => navigateMonth('prev')}>
            <ThemedText style={styles.monthNavButton}>←</ThemedText>
          </Pressable>
          <ThemedText style={styles.monthText}>
            {new Date(currentMonth + '-01').toLocaleDateString(undefined, { 
              month: 'long', 
              year: 'numeric' 
            })}
          </ThemedText>
          <Pressable onPress={() => navigateMonth('next')}>
            <ThemedText style={styles.monthNavButton}>→</ThemedText>
          </Pressable>
        </ThemedView>

        <FlatList
          data={budgets}
          renderItem={renderBudgetItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          refreshing={isLoading}
          onRefresh={loadBudgets}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {isLoading ? 'Loading budgets...' : 'No budgets set for this month'}
            </ThemedText>
          }
        />

        <Pressable 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}>
          <ThemedText style={styles.addButtonText}>
            Set Budget
          </ThemedText>
        </Pressable>

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
              <ThemedText style={styles.modalTitle}>Set Monthly Budget</ThemedText>

              <ThemedText style={styles.modalLabel}>Category</ThemedText>
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item}
                horizontal={false}
                style={styles.categoryList}
              />

              <ThemedText style={styles.modalLabel}>Budget Amount</ThemedText>
              <ThemedView style={styles.amountInputContainer}>
                <ThemedText style={styles.currencySymbol}>$</ThemedText>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  value={budgetAmount}
                  onChangeText={setBudgetAmount}
                  keyboardType="decimal-pad"
                />
              </ThemedView>

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
  title: {
    fontSize: 24,
    marginBottom: 20,
    marginTop: 10,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
  },
  monthNavButton: {
    fontSize: 24,
    padding: 10,
  },
  list: {
    flex: 1,
  },
  budgetItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    textAlign: 'right',
  },
  addButton: {
    backgroundColor: '#0A84FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
    maxHeight: 200,
    marginBottom: 20,
  },
  categoryItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  categoryItemText: {
    fontSize: 16,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
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
    marginTop: 20,
    color: '#666',
  },
  warningText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  budgetItemPressed: {
    opacity: 0.7,
  },
  deleteHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
}); 