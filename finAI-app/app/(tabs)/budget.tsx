import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import api from '@/lib/api';

type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  month: string; // Format: 'YYYY-MM'
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
      const response = await api.get(`/budgets/${currentMonth}`);
      setBudgets(response.data);
    } catch (error: any) {
      console.error('Error loading budgets:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to load budgets');
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

      await api.post('/budgets', {
        category: selectedCategory,
        amount,
        month: currentMonth,
      });

      await loadBudgets();
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving budget:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to save budget');
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

  const renderBudgetItem = ({ item }: { item: Budget }) => {
    const percentage = (item.spent / item.amount) * 100;
    const progressColor = getProgressColor(item.spent, item.amount);

    return (
      <ThemedView style={styles.budgetItem}>
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
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: progressColor
              }
            ]} 
          />
        </ThemedView>

        <ThemedText style={[styles.percentageText, { color: progressColor }]}>
          {percentage.toFixed(1)}%
        </ThemedText>
      </ThemedView>
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
          keyExtractor={(item) => item.id}
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
}); 