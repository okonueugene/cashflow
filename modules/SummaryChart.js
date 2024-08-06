import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Card } from '@rneui/themed';

const SummaryChart = ({ data }) => {
  const screenWidth = Dimensions.get("window").width;

  // if (!data || data.length === 0) {
  //   return (
  //     <View style={styles.center}>
  //       <Text>No transaction data available to display.</Text>
  //     </View>
  //   );
  // }

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
    const transactionDate = convertStringToDateTime(transaction.date);
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

  // Calculate total income and expense for the week
  const totalIncome = Object.values(weeklyTotals).reduce((sum, day) => sum + day.income, 0);
  const totalExpense = Object.values(weeklyTotals).reduce((sum, day) => sum + day.expense, 0);

  // Prepare data for bar chart
  const chartData = Object.keys(weeklyTotals).flatMap(day => [
    {
      value: weeklyTotals[day].income,
      label: day.slice(0, 2),
      frontColor: '#4caf50',
      labelWidth: 30,
      labelTextStyle: { color: 'gray' },
    },
    {
      value: weeklyTotals[day].expense,
      frontColor: '#f44336',
    }
  ]);

  // Calculate the maximum value for scaling
  const maxValue = Math.max(...chartData.map(bar => bar.value)) || 1;

  // Render the title and legend
  const renderTitle = () => (
    <View style={{ marginVertical: 30 }}>
      <Text
        style={{
          color: 'white',
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        Weekly Transactions
      </Text>
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
    <Card style={styles.card}>
      <Card.Title>Weekly Transactions</Card.Title>

      {renderTitle()}
      <BarChart
        data={chartData}
        barWidth={8}
        spacing={24}
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
        width={screenWidth * 0.8}
        height={200}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    backgroundColor: '#333340',
    paddingBottom: 40,
    borderRadius: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default SummaryChart;