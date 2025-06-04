import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

type SavingGoal = {
  id: number;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt: string;
  category?: string;
};

const GOAL_CATEGORIES = {
  'Emergency Fund': { icon: 'banknote.fill', color: '#FF9500' },
  'Vacation': { icon: 'paperplane.fill', color: '#5856D6' },
  'Home': { icon: 'house.fill', color: '#45B7D1' },
  'Car': { icon: 'car.fill', color: '#4ECDC4' },
  'Education': { icon: 'chart.pie.fill', color: '#FF2D55' },
  'Wedding': { icon: 'heart.fill', color: '#FF9999' },
  'Retirement': { icon: 'chart.pie.fill', color: '#34C759' },
  'Other': { icon: 'banknote.fill', color: '#A0A0A0' }
} as const;

export default function SavingsTab() {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [contributionModalVisible, setContributionModalVisible] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof GOAL_CATEGORIES>('Other');
  const colorScheme = useColorScheme();

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<SavingGoal[]>('/SavingGoals');
      setGoals(response.data);
    } catch (error: any) {
      console.error('Error loading goals:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to load saving goals');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadGoals();
  }, []);

  const handleSave = async () => {
    if (!title || !targetAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const amount = parseFloat(targetAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      const goalData = {
        title,
        targetAmount: amount,
        deadline: deadline?.toISOString(),
      };

      if (editingGoal) {
        await api.put(`/SavingGoals/${editingGoal.id}`, goalData);
      } else {
        await api.post('/SavingGoals', goalData);
      }

      await loadGoals();
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving goal:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to save saving goal');
    }
  };

  const handleContribute = async (goalId: number) => {
    setSelectedGoalId(goalId);
    setContributionAmount('');
    setContributionModalVisible(true);
  };

  const submitContribution = async () => {
    if (!selectedGoalId) return;

    try {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      await api.put(`/SavingGoals/${selectedGoalId}/contribute`, amount, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await loadGoals();
      setContributionModalVisible(false);
      setContributionAmount('');
      setSelectedGoalId(null);
    } catch (error: any) {
      console.error('Error contributing to goal:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to contribute to goal');
    }
  };

  const handleDelete = async (goalId: number) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this saving goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/SavingGoals/${goalId}`);
              await loadGoals();
            } catch (error: any) {
              console.error('Error deleting goal:', error?.response?.data || error.message);
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setDeadline(undefined);
    setEditingGoal(null);
  };

  const SavingsOverview = () => {
    const totalSavings = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTargets = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const overallProgress = totalTargets > 0 ? (totalSavings / totalTargets) * 100 : 0;

    return (
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.overviewContainer}
      >
        <LinearGradient
          colors={colorScheme === 'dark' ? 
            ['#1A1A1C', '#2C2C2E'] : 
            ['#FFFFFF', '#F2F2F7']
          }
          style={styles.overviewGradient}
        >
          <ThemedText style={styles.overviewTitle}>Total Savings</ThemedText>
          <ThemedText style={styles.totalAmount}>${totalSavings.toFixed(2)}</ThemedText>
          <ThemedView style={styles.overviewRow}>
            <ThemedView style={styles.overviewItem}>
              <ThemedText style={styles.overviewLabel}>Target</ThemedText>
              <ThemedText style={styles.overviewValue}>${totalTargets.toFixed(2)}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.overviewItem}>
              <ThemedText style={styles.overviewLabel}>Progress</ThemedText>
              <ThemedText style={[
                styles.overviewValue,
                { color: overallProgress >= 90 ? '#34C759' : '#0A84FF' }
              ]}>{overallProgress.toFixed(1)}%</ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={styles.overviewProgress}>
            <Animated.View
              style={[
                styles.overviewProgressFill,
                { 
                  width: `${Math.min(overallProgress, 100)}%`,
                  backgroundColor: overallProgress >= 90 ? '#34C759' : '#0A84FF'
                }
              ]}
            />
          </ThemedView>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderRightActions = (goalId: number) => {
    return (
      <ThemedView style={styles.swipeActions}>
        <Pressable
          style={[styles.swipeAction, styles.contributeAction]}
          onPress={() => handleContribute(goalId)}>
          <IconSymbol
            name="plus.circle.fill"
            size={24}
            color="#FFFFFF"
          />
          <ThemedText style={styles.swipeActionText}>Add</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => handleDelete(goalId)}>
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

  const renderGoal = ({ item, index }: { item: SavingGoal; index: number }) => {
    const progress = (item.currentAmount / item.targetAmount) * 100;
    const progressColor = progress >= 90 ? '#34C759' : '#0A84FF';
    const deadline = item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline';
    const category = (item.category ?? 'Other') as keyof typeof GOAL_CATEGORIES;
    const categoryStyle = GOAL_CATEGORIES[category];

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
              styles.goalCard,
              pressed && styles.goalCardPressed
            ]}
          >
            <LinearGradient
              colors={[
                colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
                colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF'
              ]}
              style={styles.goalGradient}
            >
              <ThemedView style={styles.goalHeader}>
                <ThemedView style={styles.goalTitleContainer}>
                  <ThemedView style={[styles.categoryIcon, { backgroundColor: categoryStyle.color + '20' }]}>
                    <IconSymbol
                      name={categoryStyle.icon}
                      size={24}
                      color={categoryStyle.color}
                    />
                  </ThemedView>
                  <ThemedView>
                    <ThemedText style={styles.goalTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.deadlineText}>{deadline}</ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedView style={styles.amountContainer}>
                  <ThemedText style={styles.currentAmount}>
                    ${item.currentAmount.toFixed(2)}
                  </ThemedText>
                  <ThemedText style={styles.targetAmount}>
                    / ${item.targetAmount.toFixed(2)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.progressContainer}>
                <ThemedView style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { 
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: progressColor
                      }
                    ]}
                  />
                </ThemedView>
                <ThemedText style={[styles.percentageText, { color: progressColor }]}>
                  {progress.toFixed(1)}%
                </ThemedText>
              </ThemedView>
            </LinearGradient>
          </Pressable>
        </Swipeable>
      </Animated.View>
    );
  };

  const renderCategoryItem = ({ item }: { item: keyof typeof GOAL_CATEGORIES }) => {
    const categoryStyle = GOAL_CATEGORIES[item];
    
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Savings Goals</ThemedText>

        <SavingsOverview />

        <Animated.View
          entering={FadeInDown.delay(400)}
          style={styles.listContainer}
        >
          <FlatList
            data={goals}
            renderItem={renderGoal}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                {isLoading ? 'Loading goals...' : 'No saving goals set'}
              </ThemedText>
            }
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(600)}
        >
          <Pressable 
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}>
            <IconSymbol
              name="plus.circle.fill"
              size={24}
              color="#FFFFFF"
            />
            <ThemedText style={styles.addButtonText}>
              Add New Goal
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
                {editingGoal ? 'Edit Goal' : 'Add New Goal'}
              </ThemedText>

              <ThemedText style={styles.modalLabel}>Category</ThemedText>
              <FlatList
                data={Object.keys(GOAL_CATEGORIES) as (keyof typeof GOAL_CATEGORIES)[]}
                renderItem={renderCategoryItem}
                keyExtractor={item => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryList}
              />

              <ThemedText style={styles.modalLabel}>Title</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter goal title"
                placeholderTextColor="#666"
                value={title}
                onChangeText={setTitle}
              />

              <ThemedText style={styles.modalLabel}>Target Amount</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter target amount"
                placeholderTextColor="#666"
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="decimal-pad"
              />

              <ThemedText style={styles.modalLabel}>Deadline (Optional)</ThemedText>
              <Pressable
                style={styles.input}
                onPress={() => setShowDatePicker(true)}>
                <ThemedText style={deadline ? styles.dateText : styles.datePlaceholder}>
                  {deadline ? deadline.toLocaleDateString() : 'Select deadline'}
                </ThemedText>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={deadline || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDeadline(selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
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
                  onPress={handleSave}>
                  <ThemedText style={styles.modalButtonText}>
                    {editingGoal ? 'Update' : 'Save'}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={contributionModalVisible}
          onRequestClose={() => {
            setContributionModalVisible(false);
            setContributionAmount('');
          }}>
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Add Contribution</ThemedText>

              <ThemedText style={styles.modalLabel}>Amount</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#666"
                value={contributionAmount}
                onChangeText={setContributionAmount}
                keyboardType="decimal-pad"
                autoFocus
              />

              <ThemedView style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setContributionModalVisible(false);
                    setContributionAmount('');
                  }}>
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={submitContribution}>
                  <ThemedText style={styles.modalButtonText}>Add</ThemedText>
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
  },
  overviewContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: 20,
    paddingTop: 24,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 20,
    lineHeight: 44,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  overviewItem: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  overviewProgress: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overviewProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  goalCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  goalCardPressed: {
    opacity: 0.7,
  },
  goalGradient: {
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  deadlineText: {
    fontSize: 13,
    opacity: 0.6,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  targetAmount: {
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
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 10,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '100%',
    borderRadius: 16,
    marginLeft: 8,
  },
  contributeAction: {
    backgroundColor: '#34C759',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#666',
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
}); 