import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Card } from '@rneui/themed';
import { convertDate } from '../utils/dateUtility';

const SummaryChartWeekly = ({ data }) => {
  const screenWidth = Dimensions.get("window").width;

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Tabulating Weekly Transactions...</Text>
      </View>
    );
  }

  // Function to convert a date string to a Date object
  const convertStringToDateTime = (str) => {
    const [datePart, timePart] = str.split(", ");
    const [month, day, year] = datePart.split("/").map(Number);

    let hours = 0, minutes = 0, seconds = 0;
    if (timePart) {
      const [time, period] = timePart.split(" ");
      [hours, minutes, seconds] = time.split(":").map(Number);
      
      if (period && period.toLowerCase() === "pm" && hours !== 12) {
        hours += 12;
      } else if (period && period.toLowerCase() === "am" && hours === 12) {
        hours = 0;
      }
    }

    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  // Function to calculate the start of the current week
  const getStartOfWeek = (date) => {
    const startOfWeek = new Date(date);
    const dayOfWeek = date.getDay();
    startOfWeek.setDate(date.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  // Get the current date and start of the week
  const currentDate = new Date();
  const startOfWeek = getStartOfWeek(currentDate);

  // Initialize an object to hold totals for each day
  const weeklyTotals = {
    Sunday: { income: 0, expense: 0 },
    Monday: { income: 0, expense: 0 },
    Tuesday: { income: 0, expense: 0 },
    Wednesday: { income: 0, expense: 0 },
    Thursday: { income: 0, expense: 0 },
    Friday: { income: 0, expense: 0 },
    Saturday: { income: 0, expense: 0 }
  };

  // Function to get the day of the week from a date object
  const getDayOfWeek = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Filter transactions from the start of the current week and calculate totals for each day
  data.forEach((transaction) => {
    const transactionDate = convertDate(transaction.date);
    if (transactionDate >= startOfWeek) {
      const day = getDayOfWeek(transactionDate);
      if (weeklyTotals[day]) {
        if (transaction.type === 'credit') {
          weeklyTotals[day].income += transaction.amount;
        } else if (transaction.type === 'deduction') {
          weeklyTotals[day].expense += transaction.amount;
        }
      }
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'gray',
  },
  titleContainer: {
    marginVertical: 30,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
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
