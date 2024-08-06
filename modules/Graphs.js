import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Card } from '@rneui/themed';import { Dimensions } from 'react-native';

const CashFlowChart = ({ data }) => {
  const screenWidth = Dimensions.get("window").width;


  // Calculate totals for each type
  const totals = data.reduce(
    (acc, transaction) => {
      if (transaction.type === 'credit') {
        acc.income += transaction.amount;
      } else if (transaction.type === 'deduction') {
        acc.expense += transaction.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  
  // Prepare data for pie chart
  const chartData = [
    { value: totals.income, color: '#4caf50', text: 'Income', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { value: totals.expense, color: '#f44336', text: 'Expense', legendFontColor: '#7F7F7F', legendFontSize: 12 }
  ];

  // Format numbers as currency
  const formatCurrency = (amount) => {
    return `Ksh ${amount.toFixed(2)}`;
  };

  return (
    <Card style={styles.card}>
      <Card.Title>Todays Transactions</Card.Title>
    <View style={styles.container}>
      <Text style={styles.totalLabel}>Total Income: {formatCurrency(totals.income)}</Text>
      <Text style={styles.totalLabel}>Total Expense: {formatCurrency(totals.expense)}</Text>
      <PieChart
        data={chartData}
        width={screenWidth * 0.8}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginTop: 20,
  },
});

export default CashFlowChart;