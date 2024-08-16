import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Card } from '@rneui/themed';

const SummaryChartMonthly = ({ data }) => {
  const screenWidth = Dimensions.get("window").width;

  

  if (!data || data.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10, fontSize: 16, color: 'gray' }}>Tabulating Monthly Transactions...</Text>
      </View>
    );
  }

  // Function to convert a date string to a Date object
  const convertStringToDateTime = (str) => {
    const [datePart, timePart] = str.split(", ");
    const [month, day, year] = datePart.split("/").map(Number);
    const [time, period] = timePart.split(" ");
    let [hours, minutes, seconds] = time.split(":").map(Number);

    if (period.toLowerCase() === "pm" && hours !== 12) {
      hours += 12;
    } else if (period.toLowerCase() === "am" && hours === 12) {
      hours = 0;
    }

    return new Date(year, month - 1, day, hours, minutes, seconds);
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
      const transactionDate = convertStringToDateTime(transaction.date);
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


// Prepare data for bar chart
const chartData = weeklyTotals.flatMap((weekData, index) => [
  {
    value: weekData.income,
    label: `W${index + 1}`,
    frontColor: '#4caf50',
    spacing: 2,
    labelWidth: 30,
    labelTextStyle: { color: 'gray' },
    topLabelComponent: () => (
      <Text style={{
        color: 'gray', fontSize: 9, fontWeight: 'bold'
      }}>
        {weekData.income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      </Text>
    ),
  },
  {
    value: weekData.expense,
    frontColor: '#f44336',
    spacing: index < weeklyTotals.length - 1 ? 20 : 2, // Add extra space after each week's data, except the last one
    labelWidth: 30,
    topLabelComponent: () => (
      <Text style={{
        color: 'gray', fontSize: 9, fontWeight: 'bold'
      }}>
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
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          marginTop: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              height: 12,
              width: 12,
              borderRadius: 6,
              backgroundColor: '#4caf50',
              marginRight: 8,
            }}
          />
          <Text style={{ color: 'lightgray' }}>Income</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              height: 12,
              width: 12,
              borderRadius: 6,
              backgroundColor: '#f44336',
              marginRight: 8,
            }}
          />
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
});

export default SummaryChartMonthly;
