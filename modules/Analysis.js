import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Card } from '@rneui/themed';

import {openDatabase} from 'react-native-sqlite-storage';
// Open the SQLite database
const db = openDatabase(
  {name: 'transactions.db', location: 'default'},
  () => console.log('Database opened successfully'),
  error => console.log('Error opening database:', error),
);

const Analysis = () => {
  const [mostExpensive, setMostExpensive] = useState([]);
  const [mostFrequent, setMostFrequent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisData();
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

  const fetchAnalysisData = () => {
    const {startTimestamp, endTimestamp} = getTimestampRangeForCurrentMonth();

    // Fetch most expensive transaction
    db.transaction(txn => {
      txn.executeSql(
        `SELECT * FROM transactions WHERE date BETWEEN ? AND ? ORDER BY amount DESC LIMIT 1`,
        [startTimestamp, endTimestamp],
        (tx, results) => {
          const rows = results.rows.raw();
          console.log('Most expensive transaction:', rows[0]);
          setMostExpensive(rows[0]);
        },
        (tx, error) => {
          console.log('Error fetching most expensive transaction:', error);
        },
      );  
    });

    // Fetch most frequent recipient
    db.transaction(txn => {
      txn.executeSql(
        `SELECT *, SUM(amount) AS total_amount
FROM transactions
WHERE date BETWEEN ? AND ?
GROUP BY counterpart
ORDER BY COUNT(*) DESC
LIMIT 1`,
        [startTimestamp, endTimestamp],
        (tx, results) => {
          const rows = results.rows.raw();
          setMostFrequent(rows[0]);
          setIsLoading(false);
        },
        (tx, error) => {
          console.log('Error fetching most frequent recipient:', error);
          setIsLoading(false);
        },
      );
    });
  };


  
   


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };



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
          Most Frequent Recipient: {mostFrequent ? `${mostFrequent.counterpart} (Total: ${formatCurrency(mostFrequent.total_amount)})` : 'N/A'}
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
