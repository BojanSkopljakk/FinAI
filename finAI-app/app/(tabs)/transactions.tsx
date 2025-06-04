import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol, type IconSymbolName } from '@/components/ui/IconSymbol';
import api from '@/lib/api';
import { useTransaction } from '../context/TransactionContext';

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
};

type CategoryStyle = {
  icon: IconSymbolName;
  color: string;
};

type CategoryStyles = {
  expense: Record<string, CategoryStyle>;
  income: Record<string, CategoryStyle>;
};

// Category icons and colors mapping
const CATEGORY_STYLES: CategoryStyles = {
  expense: {
    Food: { icon: 'cart.fill', color: '#FF6B6B' },
    Transportation: { icon: 'car.fill', color: '#4ECDC4' },
    Housing: { icon: 'house.fill', color: '#45B7D1' },
    Utilities: { icon: 'bolt.fill', color: '#96CEB4' },
    Entertainment: { icon: 'film.fill', color: '#D4A5A5' },
    Healthcare: { icon: 'heart.fill', color: '#FF9999' },
    Shopping: { icon: 'bag.fill', color: '#9B89B3' },
    Other: { icon: 'ellipsis.circle.fill', color: '#A0A0A0' }
  },
  income: {
    Salary: { icon: 'dollarsign.circle.fill', color: '#4CAF50' },
    Freelance: { icon: 'briefcase.fill', color: '#2196F3' },
    Investments: { icon: 'chart.line.uptrend.xyaxis.fill', color: '#9C27B0' },
    Gift: { icon: 'gift.fill', color: '#E91E63' },
    Other: { icon: 'ellipsis.circle.fill', color: '#A0A0A0' }
  }
};

// Predefined categories
const CATEGORIES = {
  expense: [
    'Food',
    'Transportation',
    'Housing',
    'Utilities',
    'Entertainment',
    'Healthcare',
    'Shopping',
    'Other'
  ],
  income: [
    'Salary',
    'Freelance',
    'Investments',
    'Gift',
    'Other'
  ]
};

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { showNewTransactionModal, setShowNewTransactionModal, newTransactionType } = useTransaction();

  // Add new filter states
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [showFilterStartDate, setShowFilterStartDate] = useState(false);
  const [showFilterEndDate, setShowFilterEndDate] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (showNewTransactionModal) {
      setTransactionType(newTransactionType);
      setModalVisible(true);
      setShowNewTransactionModal(false);
    }
  }, [showNewTransactionModal, newTransactionType, setShowNewTransactionModal]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error: any) {
      console.error('Error loading transactions:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/transactions/${id}`);
              await loadTransactions();
            } catch (error: any) {
              console.error('Error deleting transaction:', error?.response?.data || error.message);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setAmount(transaction.amount.toString());
    setDescription(transaction.description);
    setCategory(transaction.category);
    setTransactionType(transaction.type);
    setDate(new Date(transaction.date));
    setModalVisible(true);
  };

  const saveTransaction = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const transactionData = {
        type: transactionType,
        amount: parseFloat(amount),
        description,
        category,
        date: date.toISOString(),
      };

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, transactionData);
      } else {
        await api.post('/transactions', transactionData);
      }

      await loadTransactions();
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving transaction:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    setTransactionType('expense');
    setDate(new Date());
    setEditingTransaction(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleFilterStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowFilterStartDate(false);
    }
    if (selectedDate) {
      // Set the time to the start of the day
      const date = new Date(selectedDate);
      date.setHours(0, 0, 0, 0);
      setFilterStartDate(date);
    }
  };

  const handleFilterEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowFilterEndDate(false);
    }
    if (selectedDate) {
      // Set the time to the end of the day
      const date = new Date(selectedDate);
      date.setHours(23, 59, 59, 999);
      setFilterEndDate(date);
    }
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterStartDate(null);
    setFilterEndDate(null);
  };

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Filter by type
      if (filterType !== 'all' && transaction.type !== filterType) {
        return false;
      }

      // Filter by date range
      if (filterStartDate || filterEndDate) {
        const transactionDate = new Date(transaction.date);
        if (filterStartDate && transactionDate < filterStartDate) {
          return false;
        }
        if (filterEndDate) {
          const endOfDay = new Date(filterEndDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (transactionDate > endOfDay) {
            return false;
          }
        }
      }

      return true;
    });
  };

  const renderRightActions = (transaction: Transaction) => {
    return (
      <ThemedView style={styles.swipeActions}>
        <Pressable
          style={[styles.swipeAction, styles.editAction]}
          onPress={() => handleEdit(transaction)}>
          <ThemedText style={styles.swipeActionText}>Edit</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => handleDelete(transaction.id)}>
          <ThemedText style={styles.swipeActionText}>Delete</ThemedText>
        </Pressable>
      </ThemedView>
    );
  };

  const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => (
    <Animated.View
      entering={FadeInRight.delay(index * 100)}
      exiting={FadeOutLeft}
    >
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <Pressable
          onPress={() => handleEdit(item)}
          style={({ pressed }) => [
            styles.transactionItem,
            pressed && styles.transactionItemPressed
          ]}
        >
          <LinearGradient
            colors={[
              item.type === 'income' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
              'transparent'
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.transactionGradient}
          >
            <View style={styles.transactionIconContainer}>
              <IconSymbol
                size={24}
                name={CATEGORY_STYLES[item.type][item.category]?.icon || 'ellipsis.circle.fill'}
                color={CATEGORY_STYLES[item.type][item.category]?.color || '#A0A0A0'}
              />
            </View>
            <View style={styles.transactionContent}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionInfo}>
                  <ThemedText style={styles.transactionDescription}>{item.description}</ThemedText>
                  <ThemedText style={[
                    styles.categoryText,
                    { color: CATEGORY_STYLES[item.type][item.category]?.color }
                  ]}>
                    {item.category}
                  </ThemedText>
                </View>
                <ThemedText 
                  style={[
                    styles.transactionAmount,
                    { color: item.type === 'income' ? '#34C759' : '#FF3B30' }
                  ]}>
                  {item.type === 'income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                </ThemedText>
              </View>
              <ThemedText style={styles.transactionDate}>
                {new Date(item.date).toLocaleDateString()}
              </ThemedText>
            </View>
          </LinearGradient>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );

  const renderCategoryPicker = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={categoryModalVisible}
      onRequestClose={() => setCategoryModalVisible(false)}>
      <ThemedView style={styles.modalContainer}>
        <ThemedView style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>Select Category</ThemedText>
          <FlatList
            data={CATEGORIES[transactionType]}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.categoryItem, category === item && styles.selectedCategory]}
                onPress={() => {
                  setCategory(item);
                  setCategoryModalVisible(false);
                }}>
                <ThemedText style={[
                  styles.categoryItemText,
                  category === item && styles.selectedCategoryText
                ]}>{item}</ThemedText>
              </Pressable>
            )}
            keyExtractor={item => item}
          />
        </ThemedView>
      </ThemedView>
    </Modal>
  );

  const FilterSection = () => (
    <Animated.View 
      entering={FadeInRight}
      style={styles.filterSection}
    >
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
      >
        <View style={styles.filterButtons}>
          <Pressable
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}>
            <IconSymbol
              size={20}
              name="list.bullet"
              color={filterType === 'all' ? '#FFFFFF' : '#666666'}
            />
            <ThemedText style={[
              styles.filterButtonText,
              filterType === 'all' && styles.filterButtonTextActive
            ]}>
              All
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.filterButton, filterType === 'expense' && styles.filterButtonActive]}
            onPress={() => setFilterType('expense')}>
            <IconSymbol
              size={20}
              name="arrow.down.circle.fill"
              color={filterType === 'expense' ? '#FFFFFF' : '#666666'}
            />
            <ThemedText style={[
              styles.filterButtonText,
              filterType === 'expense' && styles.filterButtonTextActive
            ]}>
              Expenses
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.filterButton, filterType === 'income' && styles.filterButtonActive]}
            onPress={() => setFilterType('income')}>
            <IconSymbol
              size={20}
              name="arrow.up.circle.fill"
              color={filterType === 'income' ? '#FFFFFF' : '#666666'}
            />
            <ThemedText style={[
              styles.filterButtonText,
              filterType === 'income' && styles.filterButtonTextActive
            ]}>
              Income
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.dateFilters}>
        <Pressable
          style={[styles.dateFilterButton, filterStartDate && styles.dateFilterButtonActive]}
          onPress={() => setShowFilterStartDate(true)}>
          <IconSymbol
            size={20}
            name="calendar"
            color={filterStartDate ? '#0A84FF' : '#666666'}
          />
          <ThemedText style={[
            styles.dateFilterButtonText,
            filterStartDate && styles.dateFilterButtonTextActive
          ]}>
            {filterStartDate ? filterStartDate.toLocaleDateString() : 'Start Date'}
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.dateFilterSeparator}>to</ThemedText>
        <Pressable
          style={[styles.dateFilterButton, filterEndDate && styles.dateFilterButtonActive]}
          onPress={() => setShowFilterEndDate(true)}>
          <IconSymbol
            size={20}
            name="calendar"
            color={filterEndDate ? '#0A84FF' : '#666666'}
          />
          <ThemedText style={[
            styles.dateFilterButtonText,
            filterEndDate && styles.dateFilterButtonTextActive
          ]}>
            {filterEndDate ? filterEndDate.toLocaleDateString() : 'End Date'}
          </ThemedText>
        </Pressable>
      </View>

      {(filterType !== 'all' || filterStartDate || filterEndDate) && (
        <Pressable 
          style={styles.clearFiltersButton}
          onPress={clearFilters}
        >
          <IconSymbol
            size={20}
            name="xmark.circle.fill"
            color="#FFFFFF"
          />
          <ThemedText style={styles.clearFiltersText}>Clear Filters</ThemedText>
        </Pressable>
      )}

      {/* Date Pickers */}
      {(Platform.OS === 'android' && showFilterStartDate) && (
        <DateTimePicker
          value={filterStartDate ?? new Date()}
          mode="date"
          display="default"
          onChange={handleFilterStartDateChange}
          maximumDate={filterEndDate ?? undefined}
        />
      )}

      {(Platform.OS === 'android' && showFilterEndDate) && (
        <DateTimePicker
          value={filterEndDate ?? new Date()}
          mode="date"
          display="default"
          onChange={handleFilterEndDateChange}
          minimumDate={filterStartDate ?? undefined}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showFilterStartDate || showFilterEndDate}
          onRequestClose={() => {
            setShowFilterStartDate(false);
            setShowFilterEndDate(false);
          }}>
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>
                Select {showFilterStartDate ? 'Start' : 'End'} Date
              </ThemedText>
              
              <DateTimePicker
                value={showFilterStartDate ? (filterStartDate ?? new Date()) : (filterEndDate ?? new Date())}
                mode="date"
                display="spinner"
                onChange={showFilterStartDate ? handleFilterStartDateChange : handleFilterEndDateChange}
                maximumDate={showFilterStartDate ? (filterEndDate ?? undefined) : undefined}
                minimumDate={showFilterEndDate ? (filterStartDate ?? undefined) : undefined}
              />

              <ThemedView style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowFilterStartDate(false);
                    setShowFilterEndDate(false);
                  }}>
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={() => {
                    setShowFilterStartDate(false);
                    setShowFilterEndDate(false);
                  }}>
                  <ThemedText style={styles.modalButtonText}>Done</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Modal>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Transactions</ThemedText>

        <FilterSection />

        <FlatList
          data={getFilteredTransactions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshing={isLoading}
          onRefresh={loadTransactions}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {isLoading ? 'Loading transactions...' : 'No transactions found'}
            </ThemedText>
          }
        />

        <Animated.View
          entering={FadeInRight}
        >
          <Pressable 
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}>
            <IconSymbol
              size={24}
              name="plus.circle.fill"
              color="#FFFFFF"
            />
            <ThemedText style={styles.addButtonText}>
              Add Transaction
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
              <ThemedText style={styles.modalTitle}>
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </ThemedText>

              <ThemedView style={styles.typeSelector}>
                <Pressable
                  style={[
                    styles.typeButton,
                    transactionType === 'expense' && styles.selectedType
                  ]}
                  onPress={() => {
                    setTransactionType('expense');
                    setCategory('');
                  }}>
                  <ThemedText style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.selectedTypeText
                  ]}>Expense</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeButton,
                    transactionType === 'income' && styles.selectedType
                  ]}
                  onPress={() => {
                    setTransactionType('income');
                    setCategory('');
                  }}>
                  <ThemedText style={[
                    styles.typeButtonText,
                    transactionType === 'income' && styles.selectedTypeText
                  ]}>Income</ThemedText>
                </Pressable>
              </ThemedView>

              <TextInput
                style={styles.input}
                placeholder="Amount"
                placeholderTextColor="#666"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Description"
                placeholderTextColor="#666"
                value={description}
                onChangeText={setDescription}
              />

              <Pressable
                style={styles.input}
                onPress={() => setCategoryModalVisible(true)}>
                <ThemedText style={category ? styles.categorySelected : styles.categoryPlaceholder}>
                  {category || 'Select Category'}
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.input}
                onPress={() => setShowDatePicker(true)}>
                <ThemedText style={styles.dateText}>
                  {date.toLocaleDateString()}
                </ThemedText>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}

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
                  onPress={saveTransaction}>
                  <ThemedText style={styles.modalButtonText}>
                    {editingTransaction ? 'Update' : 'Save'}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Modal>

        {renderCategoryPicker()}
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
  list: {
    flex: 1,
  },
  transactionItem: {
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    overflow: 'hidden',
  },
  transactionItemPressed: {
    opacity: 0.7,
  },
  transactionGradient: {
    flexDirection: 'row',
    padding: 16,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 13,
    color: '#666',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 10,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '100%',
    borderRadius: 8,
  },
  editAction: {
    backgroundColor: '#0A84FF',
    marginRight: 5,
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
  },
  swipeActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
  },
  selectedType: {
    backgroundColor: '#0A84FF',
  },
  typeButtonText: {
    fontWeight: '600',
    color: '#000',
  },
  selectedTypeText: {
    color: '#fff',
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
    justifyContent: 'center',
  },
  categoryPlaceholder: {
    color: '#666',
  },
  categorySelected: {
    color: '#000',
  },
  dateText: {
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedCategory: {
    backgroundColor: '#0A84FF',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#000',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterScrollView: {
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: '#0A84FF',
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  dateFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 4,
  },
  dateFilterButtonActive: {
    backgroundColor: 'rgba(10,132,255,0.1)',
  },
  dateFilterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  dateFilterButtonTextActive: {
    color: '#0A84FF',
    fontWeight: '600',
  },
  dateFilterSeparator: {
    marginHorizontal: 8,
    color: '#666',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
  },
  clearFiltersText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 