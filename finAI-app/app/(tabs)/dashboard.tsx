import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
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
  monthlyTrends: MonthlyTrend[];
  topCategories: CategoryBreakdown[];
};

const colorCache: { [key: string]: string } = {};

function getRandomColor(key: string): string {
  if (colorCache[key]) {
    return colorCache[key];
  }

  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Sage
    '#FFEEAD', // Yellow
    '#D4A5A5', // Pink
    '#9FA8DA', // Purple
    '#FFE0B2', // Orange
    '#A5D6A7', // Green
    '#E0E0E0', // Gray
  ];

  const index = Object.keys(colorCache).length % colors.length;
  colorCache[key] = colors[index];
  return colorCache[key];
}

export default function dashboard() {
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions] = useState({
    width: Dimensions.get('window').width - 40,
    height: 220
  });

  useEffect(() => {
    loadDashboard();
  }, [currentMonth]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/dashboard/${currentMonth}`);
      console.log('Dashboard Data:', response.data);
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
          {dashboardData.categoryBreakdown && dashboardData.categoryBreakdown.length > 0 ? (
            <>
              <PieChart
                data={dashboardData.categoryBreakdown.map((category) => {
                  const percentage = (category.amount / dashboardData.totalExpense) * 100;
                  return {
                    name: '',  // Remove the name from the chart label
                    amount: category.amount,
                    percentage,
                    color: getRandomColor(category.category),
                    legendFontColor: '#666',
                    legendFontSize: 12,
                  };
                })}
                width={dimensions.width}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute={false}
                hasLegend={false}
                center={[dimensions.width / 4, 0]}
              />
              <ThemedView style={styles.categoryList}>
                {dashboardData.categoryBreakdown.map((category) => {
                  const percentage = (category.amount / dashboardData.totalExpense) * 100;
                  const color = getRandomColor(category.category);
                  
                  return (
                    <ThemedView key={category.category} style={styles.categoryItem}>
                      <ThemedView style={styles.categoryHeader}>
                        <ThemedView style={styles.categoryLabel}>
                          <ThemedView style={[styles.categoryDot, { backgroundColor: color }]} />
                          <ThemedText style={styles.categoryName}>{category.category}</ThemedText>
                        </ThemedView>
                        <ThemedText style={[styles.valueText, { color }]}>
                          ${category.amount.toFixed(2)} ({percentage.toFixed(1)}%)
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  );
                })}
              </ThemedView>
            </>
          ) : (
            <ThemedText style={styles.noDataText}>No category data available</ThemedText>
          )}
        </ThemedView>

        {/* Monthly Trends Chart */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Monthly Trends</ThemedText>
          {dashboardData.monthlyTrends && dashboardData.monthlyTrends.length > 0 ? (
            <>
              <LineChart
                data={{
                  labels: dashboardData.monthlyTrends.map(trend => 
                    new Date(trend.month + '-01').toLocaleDateString(undefined, { month: 'short' })
                  ),
                  datasets: [
                    {
                      data: dashboardData.monthlyTrends.map(trend => trend.income || 0),
                      color: () => '#34C759', // Green for income
                      strokeWidth: 2
                    },
                    {
                      data: dashboardData.monthlyTrends.map(trend => trend.expense || 0),
                      color: () => '#FF3B30', // Red for expense
                      strokeWidth: 2
                    }
                  ]
                }}
                width={dimensions.width}
                height={dimensions.height}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                  },
                  propsForLabels: {
                    fontSize: 12
                  },
                  style: {
                    borderRadius: 16
                  }
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                  paddingRight: 40
                }}
                bezier
                withInnerLines={false}
                withOuterLines={true}
                fromZero={true}
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
            </>
          ) : (
            <ThemedText style={styles.noDataText}>No trend data available</ThemedText>
          )}
        </ThemedView>

        {/* Top Categories */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Top Spending Categories</ThemedText>
          {dashboardData.topCategories && dashboardData.topCategories.length > 0 ? (
            dashboardData.topCategories.map((category, index) => (
              <ThemedView key={category.category} style={styles.topCategoryItem}>
                <ThemedText style={styles.topCategoryRank}>#{index + 1}</ThemedText>
                <ThemedText style={styles.topCategoryName}>{category.category}</ThemedText>
                <ThemedText style={styles.topCategoryAmount}>
                  ${category.amount.toFixed(2)}
                </ThemedText>
              </ThemedView>
            ))
          ) : (
            <ThemedText style={styles.noDataText}>No top categories data available</ThemedText>
          )}
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
  categoryList: {
    marginTop: 20,
  },
  categoryItem: {
    marginBottom: 15,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
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
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginVertical: 20,
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