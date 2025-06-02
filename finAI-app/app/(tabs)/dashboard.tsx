import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import api from '@/lib/api';

type CategoryBreakdown = {
  category: string;
  amount: number;
};

type MonthlyTrend = {
  month: string;
  income: number;
  expense: number;
};

type DashboardData = {
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: CategoryBreakdown[];
  topCategories: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
};

export default function DashboardScreen() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    loadDashboard();
  }, [currentMonth]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/dashboard/${currentMonth}`);
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
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

  const getProgressColor = (amount: number, total: number) => {
    const percentage = (amount / total) * 100;
    if (percentage >= 90) return '#FF3B30'; // Red for >= 90%
    if (percentage >= 75) return '#FF9500'; // Orange for >= 75%
    return '#34C759'; // Green for < 75%
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>No data available</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>

        {/* Month Selector */}
        <ThemedView style={styles.monthSelector}>
          <ThemedText 
            style={styles.monthNavButton}
            onPress={() => navigateMonth('prev')}>
            ←
          </ThemedText>
          <ThemedText style={styles.monthText}>
            {new Date(currentMonth + '-01').toLocaleDateString(undefined, { 
              month: 'long', 
              year: 'numeric' 
            })}
          </ThemedText>
          <ThemedText 
            style={styles.monthNavButton}
            onPress={() => navigateMonth('next')}>
            →
          </ThemedText>
        </ThemedView>

        {/* Summary Cards */}
        <ThemedView style={styles.summaryContainer}>
          <ThemedView style={[styles.summaryCard, styles.incomeCard]}>
            <ThemedText style={styles.summaryLabel}>Income</ThemedText>
            <ThemedText style={[styles.summaryAmount, styles.incomeText]}>
              ${dashboardData.totalIncome.toFixed(2)}
            </ThemedText>
          </ThemedView>
          <ThemedView style={[styles.summaryCard, styles.expenseCard]}>
            <ThemedText style={styles.summaryLabel}>Expenses</ThemedText>
            <ThemedText style={[styles.summaryAmount, styles.expenseText]}>
              ${dashboardData.totalExpense.toFixed(2)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Category Breakdown */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Category Breakdown</ThemedText>
          {dashboardData.categoryBreakdown.map((category) => {
            const percentage = (category.amount / dashboardData.totalExpense) * 100;
            const progressColor = getProgressColor(category.amount, dashboardData.totalExpense);
            
            return (
              <ThemedView key={category.category} style={styles.categoryItem}>
                <ThemedView style={styles.categoryHeader}>
                  <ThemedText style={styles.categoryName}>{category.category}</ThemedText>
                  <ThemedText style={styles.categoryAmount}>
                    ${category.amount.toFixed(2)}
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
              </ThemedView>
            );
          })}
        </ThemedView>

        {/* Monthly Trends Chart */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Monthly Trends</ThemedText>
          <LineChart
            data={{
              labels: dashboardData.monthlyTrends.map(trend => 
                new Date(trend.month + '-01').toLocaleDateString(undefined, { month: 'short' })
              ),
              datasets: [
                {
                  data: dashboardData.monthlyTrends.map(trend => trend.income),
                  color: () => '#34C759', // Green for income
                  strokeWidth: 2
                },
                {
                  data: dashboardData.monthlyTrends.map(trend => trend.expense),
                  color: () => '#FF3B30', // Red for expense
                  strokeWidth: 2
                }
              ]
            }}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            bezier
            style={styles.chart}
          />
          <ThemedView style={styles.chartLegend}>
            <ThemedView style={styles.legendItem}>
              <ThemedView style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <ThemedText style={styles.legendText}>Income</ThemedText>
            </ThemedView>
            <ThemedView style={styles.legendItem}>
              <ThemedView style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
              <ThemedText style={styles.legendText}>Expenses</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Top Categories */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Top Spending Categories</ThemedText>
          {dashboardData.topCategories.map((category, index) => (
            <ThemedView key={category.category} style={styles.topCategoryItem}>
              <ThemedText style={styles.topCategoryRank}>#{index + 1}</ThemedText>
              <ThemedText style={styles.topCategoryName}>{category.category}</ThemedText>
              <ThemedText style={styles.topCategoryAmount}>
                ${category.amount.toFixed(2)}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      </ScrollView>
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
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#FF3B30',
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    backgroundColor: '#f8f8f8',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '600',
  },
  incomeText: {
    color: '#34C759',
  },
  expenseText: {
    color: '#FF3B30',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  categoryItem: {
    marginBottom: 15,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 16,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '500',
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  topCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  topCategoryRank: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
    color: '#666',
  },
  topCategoryName: {
    flex: 1,
    fontSize: 16,
  },
  topCategoryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 