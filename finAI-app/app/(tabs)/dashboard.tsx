import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
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

const CATEGORY_ICONS = {
  'Food & Dining': { icon: 'banknote.fill', color: '#FF9500' },
  'Shopping': { icon: 'cart.fill', color: '#5856D6' },
  'Housing': { icon: 'house.fill', color: '#45B7D1' },
  'Transportation': { icon: 'car.fill', color: '#4ECDC4' },
  'Entertainment': { icon: 'heart.fill', color: '#FF2D55' },
  'Healthcare': { icon: 'heart.fill', color: '#FF9999' },
  'Other': { icon: 'banknote.fill', color: '#A0A0A0' }
} as const;

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions] = useState({
    width: Dimensions.get('window').width - 40,
    height: 220
  });
  const colorScheme = useColorScheme();

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

  const balance = dashboardData.totalIncome - dashboardData.totalExpense;
  const savingsRate = (balance / dashboardData.totalIncome) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>
        
        {/* Month Selector */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          style={styles.monthSelector}
        >
          <Pressable onPress={() => navigateMonth('prev')}>
            <IconSymbol
              name="chevron.left.forwardslash.chevron.right"
              size={24}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </Pressable>
          <ThemedText style={styles.monthText}>
            {new Date(currentMonth + '-01').toLocaleDateString(undefined, { 
              month: 'long', 
              year: 'numeric' 
            })}
          </ThemedText>
          <Pressable onPress={() => navigateMonth('next')}>
            <IconSymbol
              name="chevron.left.forwardslash.chevron.right"
              size={24}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </Pressable>
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View 
          entering={FadeInDown.delay(200)}
          style={styles.summaryContainer}
        >
          <LinearGradient
            colors={colorScheme === 'dark' ? 
              ['#2C2C2E', '#1C1C1E'] : 
              ['#F2F2F7', '#FFFFFF']
            }
            style={[styles.summaryCard, styles.balanceCard]}
          >
            <ThemedText style={styles.summaryLabel}>Balance</ThemedText>
            <ThemedText style={[styles.summaryAmount, { color: balance >= 0 ? '#34C759' : '#FF3B30' }]}>
              ${balance.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.savingsRate}>
              {savingsRate >= 0 ? `+${savingsRate.toFixed(1)}%` : `${savingsRate.toFixed(1)}%`} savings rate
            </ThemedText>
          </LinearGradient>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(300)}
          style={styles.summaryRow}
        >
          <LinearGradient
            colors={colorScheme === 'dark' ? 
              ['#2C2C2E', '#1C1C1E'] : 
              ['#F2F2F7', '#FFFFFF']
            }
            style={[styles.summaryCard, styles.halfCard]}
          >
            <ThemedView style={styles.cardHeader}>
              <IconSymbol
                name="arrow.down.circle.fill"
                size={24}
                color="#34C759"
              />
              <ThemedText style={styles.summaryLabel}>Income</ThemedText>
            </ThemedView>
            <ThemedText style={[styles.summaryAmount, styles.incomeText]}>
              ${dashboardData.totalIncome.toFixed(2)}
            </ThemedText>
          </LinearGradient>

          <LinearGradient
            colors={colorScheme === 'dark' ? 
              ['#2C2C2E', '#1C1C1E'] : 
              ['#F2F2F7', '#FFFFFF']
            }
            style={[styles.summaryCard, styles.halfCard]}
          >
            <ThemedView style={styles.cardHeader}>
              <IconSymbol
                name="arrow.up.circle.fill"
                size={24}
                color="#FF3B30"
              />
              <ThemedText style={styles.summaryLabel}>Expenses</ThemedText>
            </ThemedView>
            <ThemedText style={[styles.summaryAmount, styles.expenseText]}>
              ${dashboardData.totalExpense.toFixed(2)}
            </ThemedText>
          </LinearGradient>
        </Animated.View>

        {/* Category Breakdown */}
        <Animated.View 
          entering={FadeInDown.delay(400)}
          style={styles.section}
        >
          <ThemedText style={styles.sectionTitle}>Spending by Category</ThemedText>
          {dashboardData.categoryBreakdown && dashboardData.categoryBreakdown.length > 0 ? (
            <LinearGradient
              colors={colorScheme === 'dark' ? 
                ['#2C2C2E', '#1C1C1E'] : 
                ['#F2F2F7', '#FFFFFF']
              }
              style={styles.chartCard}
            >
              <PieChart
                data={dashboardData.categoryBreakdown.map((category) => {
                  const percentage = (category.amount / dashboardData.totalExpense) * 100;
                  const categoryInfo = CATEGORY_ICONS[category.category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.Other;
                  return {
                    name: category.category,
                    amount: category.amount,
                    percentage,
                    color: categoryInfo.color,
                    legendFontColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                    legendFontSize: 12,
                  };
                })}
                width={dimensions.width - 32}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(${colorScheme === 'dark' ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(${colorScheme === 'dark' ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute={false}
                hasLegend={false}
              />
              <ThemedView style={styles.categoryList}>
                {dashboardData.categoryBreakdown.map((category) => {
                  const percentage = (category.amount / dashboardData.totalExpense) * 100;
                  const categoryInfo = CATEGORY_ICONS[category.category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.Other;
                  
                  return (
                    <ThemedView key={category.category} style={styles.categoryItem}>
                      <ThemedView style={styles.categoryHeader}>
                        <ThemedView style={styles.categoryLabel}>
                          <ThemedView style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                            <IconSymbol
                              name={categoryInfo.icon}
                              size={20}
                              color={categoryInfo.color}
                            />
                          </ThemedView>
                          <ThemedText style={styles.categoryName}>{category.category}</ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.categoryValues}>
                          <ThemedText style={styles.categoryAmount}>
                            ${category.amount.toFixed(2)}
                          </ThemedText>
                          <ThemedText style={[styles.categoryPercentage, { color: categoryInfo.color }]}>
                            {percentage.toFixed(1)}%
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                      <ThemedView style={styles.progressBar}>
                        <Animated.View
                          style={[
                            styles.progressFill,
                            { 
                              width: `${percentage}%`,
                              backgroundColor: categoryInfo.color
                            }
                          ]}
                        />
                      </ThemedView>
                    </ThemedView>
                  );
                })}
              </ThemedView>
            </LinearGradient>
          ) : (
            <ThemedText style={styles.noDataText}>No category data available</ThemedText>
          )}
        </Animated.View>

        {/* Monthly Trends Chart */}
        <Animated.View 
          entering={FadeInDown.delay(500)}
          style={styles.section}
        >
          <ThemedText style={styles.sectionTitle}>Monthly Trends</ThemedText>
          {dashboardData.monthlyTrends && dashboardData.monthlyTrends.length > 0 ? (
            <LinearGradient
              colors={colorScheme === 'dark' ? 
                ['#2C2C2E', '#1C1C1E'] : 
                ['#F2F2F7', '#FFFFFF']
              }
              style={styles.chartCard}
            >
              <LineChart
                data={{
                  labels: dashboardData.monthlyTrends.map(trend => 
                    new Date(trend.month + '-01').toLocaleDateString(undefined, { month: 'short' })
                  ),
                  datasets: [
                    {
                      data: dashboardData.monthlyTrends.map(trend => trend.income || 0),
                      color: () => '#34C759', // Solid green
                      strokeWidth: 3
                    },
                    {
                      data: dashboardData.monthlyTrends.map(trend => trend.expense || 0),
                      color: () => '#FF3B30', // Solid red
                      strokeWidth: 3
                    }
                  ]
                }}
                width={dimensions.width - 32}
                height={220}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                  backgroundGradientFrom: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                  backgroundGradientTo: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                  decimalPlaces: 0,
                  color: () => colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                  labelColor: () => colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7'
                  },
                  propsForLabels: {
                    fontSize: 12,
                    fontWeight: '600'
                  },
                  propsForVerticalLabels: {
                    fontSize: 12,
                    fontWeight: '600'
                  },
                  strokeWidth: 3,
                  useShadowColorFromDataset: false
                }}
                bezier
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={true}
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
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
            </LinearGradient>
          ) : (
            <ThemedText style={styles.noDataText}>No trend data available</ThemedText>
          )}
        </Animated.View>
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
  },
  balanceCard: {
    marginBottom: 16,
  },
  halfCard: {
    width: '48%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 4,
  },
  savingsRate: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  incomeText: {
    color: '#34C759',
  },
  expenseText: {
    color: '#FF3B30',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  categoryList: {
    marginTop: 16,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryValues: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#FF3B30',
  },
  noDataText: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 20,
  },
}); 