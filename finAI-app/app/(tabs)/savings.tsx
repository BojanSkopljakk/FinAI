import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import api from '@/lib/api';

type SavingGoal = {
  id: number;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt: string;
};

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

  const renderGoal = ({ item }: { item: SavingGoal }) => {
    const progress = (item.currentAmount / item.targetAmount) * 100;
    const progressColor = progress >= 90 ? '#34C759' : '#0A84FF';
    const deadline = item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline';

    return (
      <Pressable
        onLongPress={() => handleDelete(item.id)}
        style={({ pressed }) => [
          styles.goalCard,
          pressed && styles.goalCardPressed
        ]}>
        <ThemedView style={styles.goalHeader}>
          <ThemedText style={styles.goalTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.amountText}>
            ${item.currentAmount.toFixed(2)} / ${item.targetAmount.toFixed(2)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.progressBarContainer}>
          <ThemedView 
            style={[
              styles.progressBar, 
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

        <ThemedText style={styles.deadlineText}>Deadline: {deadline}</ThemedText>

        <ThemedView style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, styles.contributeButton]}
            onPress={() => handleContribute(item.id)}>
            <ThemedText style={styles.actionButtonText}>Contribute</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedText style={styles.deleteHint}>
          Long press to delete
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Savings Goals</ThemedText>

        <FlatList
          data={goals}
          renderItem={renderGoal}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          refreshing={isLoading}
          onRefresh={loadGoals}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {isLoading ? 'Loading goals...' : 'No saving goals set'}
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
            Add New Goal
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
              <ThemedText style={styles.modalTitle}>
                {editingGoal ? 'Edit Goal' : 'Add New Goal'}
              </ThemedText>

              <ThemedText style={styles.modalLabel}>Title</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter goal title"
                placeholderTextColor="#666"
                value={title}
                onChangeText={setTitle}
              />

              <ThemedText style={styles.modalLabel}>Target Amount</ThemedText>
              <ThemedView style={styles.amountInputContainer}>
                <ThemedText style={styles.currencySymbol}>$</ThemedText>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="decimal-pad"
                />
              </ThemedView>

              <ThemedText style={styles.modalLabel}>Deadline (Optional)</ThemedText>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}>
                <ThemedText style={styles.dateButtonText}>
                  {deadline ? deadline.toLocaleDateString() : 'Select deadline'}
                </ThemedText>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={deadline || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDeadline(selectedDate);
                    }
                  }}
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
                  <ThemedText style={styles.modalButtonText}>Save</ThemedText>
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
            setSelectedGoalId(null);
          }}>
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>
                Add Contribution
              </ThemedText>

              <ThemedText style={styles.modalLabel}>Amount</ThemedText>
              <ThemedView style={styles.amountInputContainer}>
                <ThemedText style={styles.currencySymbol}>$</ThemedText>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  value={contributionAmount}
                  onChangeText={setContributionAmount}
                  keyboardType="decimal-pad"
                />
              </ThemedView>

              <ThemedView style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setContributionModalVisible(false);
                    setContributionAmount('');
                    setSelectedGoalId(null);
                  }}>
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={submitContribution}>
                  <ThemedText style={styles.modalButtonText}>Contribute</ThemedText>
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
  list: {
    flex: 1,
  },
  goalCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
  },
  goalCardPressed: {
    opacity: 0.7,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 18,
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
    marginBottom: 5,
  },
  deadlineText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  contributeButton: {
    backgroundColor: '#0A84FF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
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
  dateButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
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