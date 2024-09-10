import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Card } from '@rneui/themed';
import { openDatabase } from 'react-native-sqlite-storage';

// Open the SQLite database
const db = openDatabase(
  { name: 'transactions.db', location: 'default' },
  () => console.log('Database opened successfully'),
  (error) => console.log('Error opening database:', error)
);

const SummaryChartMonthly = () => {
  const screenWidth = Dimensions.get("window").width;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyTransactions();
  }, []);

  // Function to get the current month's timestamp range
  function getTimestampRangeForCurrentMonth() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startTimestamp: firstDayOfMonth.getTime(),
      endTimestamp: lastDayOfMonth.getTime(),
    };
  }

  // Fetch monthly transactions from SQLite
  const fetchMonthlyTransactions = () => {
    const { startTimestamp, endTimestamp } = getTimestampRangeForCurrentMonth();

    db.transaction((txn) => {
      txn.executeSql(
        `SELECT * FROM transactions WHERE date >= ? AND date <= ?`,
        [startTimestamp, endTimestamp],
        (tx, results) => {
          const rows = results.rows.raw();
          setData(rows);
          setLoading(false);
        },
        (tx, error) => {
          console.log('Error fetching transactions:', error);
          setLoading(false);
        }
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Tabulating Monthly Transactions...</Text>
      </View>
    );
  }

  // Function to convert a timestamp to a Date object
  const convertTimestampToDate = (timestamp) => {
    return new Date(timestamp);
  };

  // Function to calculate the start of the week
  const getStartOfWeek = (date) => {
    const startOfWeek = new Date(date);
    const dayOfWeek = date.getDay();
    startOfWeek.setDate(date.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  // Determine the first and last days of the month
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  const lastDayOfMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0);

  // Initialize an array to hold weekly totals
  const weeklyTotals = [];

  // Start from the week containing the first day of the month
  let currentWeekStart = getStartOfWeek(firstDayOfMonth);

  while (currentWeekStart <= lastDayOfMonth) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Initialize totals for the current week
    const weekData = {
      start: new Date(currentWeekStart),
      income: 0,
      expense: 0
    };

    // Accumulate transactions within the current week
    data.forEach((transaction) => {
      const transactionDate = convertTimestampToDate(transaction.date);
      if (transactionDate >= currentWeekStart && transactionDate <= weekEnd) {
        if (transaction.type === 'credit') {
          weekData.income += transaction.amount;
        } else if (transaction.type === 'deduction') {
          weekData.expense += transaction.amount;
        }
      }
    });

    // Add weekly totals to the array
    weeklyTotals.push(weekData);

    // Move to the next week
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  // Prepare data for the bar chart
  const chartData = weeklyTotals.flatMap((weekData, index) => [
    {
      value: weekData.income,
      label: `W${index + 1}`,
      frontColor: '#4caf50',
      spacing: 2,
      labelWidth: 30,
      labelTextStyle: { color: 'gray' },
      topLabelComponent: () => (
        <Text style={{ color: 'gray', fontSize: 9, fontWeight: 'bold' }}>
          {weekData.income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </Text>
      ),
    },
    {
      value: weekData.expense,
      frontColor: '#f44336',
      spacing: index < weeklyTotals.length - 1 ? 20 : 2,
      labelWidth: 30,
      topLabelComponent: () => (
        <Text style={{ color: 'gray', fontSize: 9, fontWeight: 'bold' }}>
          {weekData.expense.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </Text>
      ),
    }
  ]);

  // Calculate the maximum value for scaling
  const maxValue = Math.max(...chartData.map(bar => bar.value)) || 1;

  // Calculate dynamic width based on the number of bars
  const chartWidth = chartData.length * 50;

  // Render the title and legend
  const renderTitle = () => (
    <View style={{ marginVertical: 30 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ height: 12, width: 12, borderRadius: 6, backgroundColor: '#4caf50', marginRight: 8 }} />
          <Text style={{ color: 'lightgray' }}>Income</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ height: 12, width: 12, borderRadius: 6, backgroundColor: '#f44336', marginRight: 8 }} />
          <Text style={{ color: 'lightgray' }}>Expense</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Card containerStyle={styles.card}>
      <Card.Title>Monthly Weekly Transactions</Card.Title>
      {renderTitle()}
      <ScrollView
        horizontal
        contentContainerStyle={styles.chartContainer}
        showsHorizontalScrollIndicator={false}
      >
        <BarChart
          data={chartData}
          barWidth={40}
          spacing={15}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{ color: 'gray' }}
          noOfSections={6}
          maxValue={maxValue}
          yAxisLabelWidth={60}
          isAnimated
          animationDuration={1000}
          width={chartWidth}
          height={200}
        />
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartContainer: {
    paddingHorizontal: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'gray',
  },
});

export default SummaryChartMonthly;
