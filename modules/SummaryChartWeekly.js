import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Card } from '@rneui/themed';
import { openDatabase } from 'react-native-sqlite-storage';

const db = openDatabase(
  { name: 'transactions.db', location: 'default' },
  () => {
    console.log('Database opened successfully');
  },
  (error) => {
    console.log('Error opening database:', error);
  }
);

const SummaryChartWeekly = () => {
  const screenWidth = Dimensions.get("window").width;
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchWeeklyTransactions();
  }, []);

  function getTimestampRangeForCurrentWeek() {
    const now = new Date();
    // Find the first day of the week (Sunday)
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    firstDayOfWeek.setHours(0, 0, 0, 0); // Start of Sunday

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // End of Saturday
    lastDayOfWeek.setHours(23, 59, 59, 999); // End of the day

    return {
      startTimestamp: firstDayOfWeek.getTime(),
      endTimestamp: lastDayOfWeek.getTime(),
    };
  }

  const fetchWeeklyTransactions = () => {
    const { startTimestamp, endTimestamp } = getTimestampRangeForCurrentWeek();
    db.transaction((txn) => {
      txn.executeSql(
        `SELECT * FROM transactions WHERE date >= ? AND date <= ?`,
        [startTimestamp, endTimestamp],
        (tx, results) => {
          const rows = results.rows.raw();
          setData(rows);
        },
        (tx, error) => {
          console.log('Error fetching transactions:', error);
        }
      );
    });
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Tabulating Weekly Transactions...</Text>
      </View>
    );
  }

  // Initialize an object to hold totals for each day
  const weeklyTotals = {
    Sunday: { income: 0, expense: 0 },
    Monday: { income: 0, expense: 0 },
    Tuesday: { income: 0, expense: 0 },
    Wednesday: { income: 0, expense: 0 },
    Thursday: { income: 0, expense: 0 },
    Friday: { income: 0, expense: 0 },
    Saturday: { income: 0, expense: 0 },
  };

  // Function to get the day of the week from a timestamp
  const getDayOfWeek = (timestamp) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(timestamp);
    return days[date.getDay()];
  };

  // Iterate over the data and populate weeklyTotals
  data.forEach((transaction) => {
    const dayOfWeek = getDayOfWeek(transaction.date);
    if (transaction.type === 'credit') {
      weeklyTotals[dayOfWeek].income += transaction.amount;
    } else if (transaction.type === 'deduction') {
      weeklyTotals[dayOfWeek].expense += transaction.amount;
    }
  });

  // Prepare data for bar chart
  const chartData = Object.keys(weeklyTotals).flatMap(day => [
    {
      value: weeklyTotals[day].income,
      label: day.slice(0, 2),
      frontColor: '#4caf50',
      labelWidth: 30,
      labelTextStyle: { color: 'gray' },
      topLabelComponent: () => (
        <Text style={{
          color: 'gray', fontSize: 9, fontWeight: 'bold'
        }}>
          {weeklyTotals[day].income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </Text>
      ),
    },
    {
      value: weeklyTotals[day].expense,
      frontColor: '#f44336',
      topLabelComponent: () => (
        <View style={{ flexDirection: 'row' }}>
          <Text style={{
            color: 'gray', fontSize: 8, fontWeight: 'bold'
          }}>
            {weeklyTotals[day].expense.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </Text>
        </View>
      ),
    }
  ]);

  // Calculate the maximum value for scaling
  const maxValue = Math.max(...chartData.map(bar => bar.value)) || 1;

  // Calculate dynamic width based on the number of bars
  const chartWidth = chartData.length * 50;

  // Render the title and legend
  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4caf50' }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f44336' }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Card containerStyle={styles.card}>
      <Card.Title>Weekly Transactions</Card.Title>
      {renderTitle()}
      <ScrollView
        horizontal
        contentContainerStyle={styles.chartContainer}
        showsHorizontalScrollIndicator={true}
      >
        <BarChart
          data={chartData}
          barWidth={30}
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
          width={chartWidth}  // Adjust width to accommodate the chart content dynamically
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
  titleContainer: {
    marginVertical: 30,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    height: 12,
    width: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: 'lightgray',
  },
  chartContainer: {
    paddingHorizontal: 10,
  },
});

export default SummaryChartWeekly;
