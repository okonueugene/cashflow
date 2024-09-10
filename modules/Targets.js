import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {Card} from '@rneui/themed';
import {PieChart} from 'react-native-gifted-charts';
import {openDatabase} from 'react-native-sqlite-storage';

// Open the SQLite database
const db = openDatabase(
  {name: 'transactions.db', location: 'default'},
  () => console.log('Database opened successfully'),
  error => console.log('Error opening database:', error),
);

const Targets = ({balance, targetSavings}) => {
  const [totalSavings, setTotalSavings] = useState(0);
  const [status, setStatus] = useState('Below Target');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const {startTimestamp, endTimestamp} = getTimestampRangeForCurrentMonth();

    db.transaction(txn => {
      txn.executeSql(
        `SELECT * FROM transactions WHERE date BETWEEN ? AND ?`,
        [startTimestamp, endTimestamp],
        (tx, results) => {
          const rows = results.rows.raw();
          setTransactions(rows);
          setIsLoading(false);
        },
        (tx, error) => {
          console.log('Error fetching transactions:', error);
          setIsLoading(false);
        },
      );
    });
  };

  const calculateTotalSavings = () => {
    // Calculate total credits (income)
    const creditTotal = transactions
      .filter(transaction => transaction.type === 'credit')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    // Calculate total debits (expenses)
    const debitTotal = transactions
      .filter(transaction => transaction.type === 'deduction')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    // Net savings = total credits - total debits
    const netSavings = creditTotal - debitTotal;
    setTotalSavings(netSavings);
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // Calculate progress (net savings vs target savings)
  const progress =
    totalSavings < 0
      ? totalSavings / targetSavings
      : Math.min(totalSavings / targetSavings, 1);

  const chartData = [
    {
      value: Math.max(0, Math.abs(progress) * 100), // Ensure value is never negative
      color: progress >= 0 ? '#4caf50' : progress < -1 ? '#8B0000' : '#ff0000', // Dark red for high negative, green for positive
      text: formatCurrency(totalSavings),
    },
    {
      value: Math.max(0, (1 - Math.abs(progress)) * 100), // Ensure value is never negative
      color: '#f44336',
      text: formatCurrency(targetSavings - totalSavings),
    },
  ];

  const targetSavingsPerDay = targetSavings / 30;
  const currentDate = new Date();
  const dayOfMonth = currentDate.getDate();
  const expectedSavingsByNow = targetSavingsPerDay * dayOfMonth;

  const getProgressBarColor = progress => {
    if (progress < 0) {
      // Darker red for negative progress
      if (progress < -1) return '#8B0000'; // Very dark red for extreme negative progress
      return '#ff0000'; // Standard red for negative progress
    }
    if (progress <= 0.25) return '#f44336'; // Red
    if (progress <= 0.5) return '#ffeb3b'; // Yellow
    if (progress <= 0.75) return '#ff9800'; // Orange
    if (progress > 0.9) return '#4caf50'; // Green
    return '#2196f3'; // Blue for between 75% and 90%
  };

  // Determine status based on progress
  useEffect(() => {
    fetchMonthlyTransactions();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      calculateTotalSavings();
      if (progress >= 1) {
        setStatus('Target Achieved');
      } else if (progress >= 0.75) {
        setStatus('Almost There');
      } else if (progress >= 0.5) {
        setStatus('Halfway There');
      } else if (progress >= 0.25) {
        setStatus('Getting There');
      } else if (progress >= 0) {
        setStatus('Below Target');
      } else if (progress < 0 && progress >= -0.5) {
        setStatus('Overspending');
      } else {
        setStatus('Overbudget');
      }
    }
  }, [isLoading, transactions, progress]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Tabulating Target Savings...</Text>
      </View>
    );
  }

  return (
    <Card containerStyle={styles.card}>
      <Card.Title style={styles.cardTitle}>Target Savings Analysis</Card.Title>
      <View style={styles.container}>
        <Text style={styles.totalLabel}>
          Current Balance: {balance !== null ? formatCurrency(balance) : 'N/A'}
        </Text>
        <Text style={styles.totalLabel}>
          Expected Savings by Now:{' '}
          {expectedSavingsByNow > 0
            ? formatCurrency(expectedSavingsByNow)
            : 'N/A'}
        </Text>
        <Text style={styles.totalLabel}>
          Daily Savings Target:{' '}
          {targetSavingsPerDay > 0
            ? formatCurrency(targetSavingsPerDay)
            : 'N/A'}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.abs(progress * 100).toFixed(2)}%`,
                backgroundColor: getProgressBarColor(progress),
              },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>{`Progress: ${(
          progress * 100
        ).toFixed(2)}%`}</Text>

        <View style={styles.chartContainer}>
          <PieChart
            data={chartData}
            donut
            showGradient
            sectionAutoFocus
            radius={90}
            innerRadius={60}
            innerCircleColor={'#232B5D'}
            centerLabelComponent={() => (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Text style={styles.chartProgressText}>{`${(
                  progress * 100
                ).toFixed(2)}%`}</Text>
                <Text style={styles.chartSubText}>{status}</Text>
              </View>
            )}
          />
        </View>
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
    shadowOffset: {width: 0, height: 2},
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
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: 14,
    marginTop: 5,
    color: '#333',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 20,
  },
  chartProgressText: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  chartSubText: {
    fontSize: 14,
    color: 'white',
  },
});

export default Targets;