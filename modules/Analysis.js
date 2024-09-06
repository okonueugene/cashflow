import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Card } from '@rneui/themed';

const Analysis = ({ transactions }) => {
  const [mostExpensive, setMostExpensive] = useState(null);
  const [mostFrequent, setMostFrequent] = useState(null);

  const isLoading = transactions.length === 0;

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      calculateTransactionsAnalysis(transactions);
    }
  }, [transactions]);

  const calculateTransactionsAnalysis = (transactions) => {
    let maxAmount = 0;
    let maxTransaction = null;

    const counterpartMap = {};
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear &&
        transaction.type === 'deduction'
      );
    });

    filteredTransactions.forEach(transaction => {
      if (transaction.amount > maxAmount) {
        maxAmount = transaction.amount;
        maxTransaction = transaction;
      }

      if (transaction.counterpart) {
        if (!counterpartMap[transaction.counterpart]) {
          counterpartMap[transaction.counterpart] = {
            count: 0,
            totalAmount: 0,
          };
        }
        counterpartMap[transaction.counterpart].count++;
        counterpartMap[transaction.counterpart].totalAmount += transaction.amount;
      }
    });

    setMostExpensive(maxTransaction);

    let mostFrequentCounterpart = null;
    let highestCount = 0;

    Object.keys(counterpartMap).forEach(counterpart => {
      if (counterpartMap[counterpart].count > highestCount) {
        highestCount = counterpartMap[counterpart].count;
        mostFrequentCounterpart = counterpart;
      }
    });

    if (mostFrequentCounterpart) {
      setMostFrequent({
        counterpart: mostFrequentCounterpart,
        totalAmount: counterpartMap[mostFrequentCounterpart].totalAmount,
      });
    }
  };



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const currentDate = new Date();
  const dayOfMonth = currentDate.getDate();


  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Tabulating Monthly Expenses...</Text>
      </View>
    );
  }

  return (
    <Card containerStyle={styles.card}>
      <Card.Title style={styles.cardTitle}>Monthly Expenses Analysis</Card.Title>
      <View style={styles.container}>
        <Text style={styles.totalLabel}>
          Most Expensive Transaction: {mostExpensive ? `${mostExpensive.counterpart} (${formatCurrency(mostExpensive.amount)})` : 'N/A'}
        </Text>
        <Text style={styles.totalLabel}>
          Most Frequent Recipient: {mostFrequent ? `${mostFrequent.counterpart} (Total: ${formatCurrency(mostFrequent.totalAmount)})` : 'N/A'}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flex: 1,
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
  cardTitle: {
    fontSize: 18,
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'gray',
  },
  progressBar: {
    width: Dimensions.get('window').width - 40,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 14,
    marginTop: 5,
    color: '#333',
  },
});

export default Analysis;
