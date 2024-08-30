import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Card } from '@rneui/themed';
import { Dimensions } from 'react-native';

const CashFlowChart = ({ data }) => {
  const screenWidth = Dimensions.get("window").width;

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Tabulating Todays Transactions...</Text>
      </View>
    );
  }

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
  // Format numbers as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };


  // Prepare data for pie chart
  const chartData = [
    { value: totals.income, color: '#4caf50', text: formatCurrency(totals.income), legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { value: totals.expense, color: '#f44336', text: formatCurrency(totals.expense), legendFontColor: '#7F7F7F', legendFontSize: 12 }
  ];


  return (
    <Card containerStyle={styles.card}>
      <Card.Title>Todays Transactions</Card.Title>
      <View style={styles.container}>
        <Text style={styles.totalLabel}>Total Income: {formatCurrency(totals.income)}</Text>
        <Text style={styles.totalLabel}>Total Expense: {formatCurrency(totals.expense)}</Text>
        <PieChart
          data={chartData}
          width={screenWidth * 0.8}
          focusOnPress
          showText
          textSize={12}
          textColor="white"
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
    marginTop: 30,
    marginBottom: 30,
  },
  card: {
    marginTop: 12,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'gray',
  },
});

export default CashFlowChart;