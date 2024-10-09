import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import SummaryChartMonthly from './SumarryChartMonthly';
import SummaryChartWeekly from './SummaryChartWeekly';
import SummaryChartYearly from './SummaryChartYearly';
import CashFlowChart from './Graphs';
import Analysis from './Analysis';
import Targets from './Targets';
import { openDatabase } from 'react-native-sqlite-storage';

// Define custom error handler
const errorHandler = (error, isFatal) => {
  if (isFatal) {
    Alert.alert(
      'Unexpected error occurred',
      `Error: ${isFatal ? 'Fatal:' : ''} ${error.name} ${error.message}`,
      [
        {
          text: 'Restart',
          onPress: () => {
            // Restart the app or handle the fatal error accordingly
          },
        },
      ]
    );
  } else {
    console.log(error); // Log non-fatal errors for debugging
  }
};

setJSExceptionHandler(errorHandler, true);

// Optional: Handle native exceptions as well
setNativeExceptionHandler((errorString) => {
  console.log('Native error:', errorString);
  // Handle native exceptions
});

// Initialize the database
const db = openDatabase(
  { name: 'transactions.db', location: 'default' },
  () => {
    console.log('Database opened successfully');
  },
  (error) => {
    console.log('Error opening database:', error);
  }
);

const ReadSMS = ({ smsList, targetSavings }) => {
  const [noTransactions, setNoTransactions] = useState(false);
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Updated state for loading
  const [pendingTransactions, setPendingTransactions] = useState(0); // To track pending transactions
  const [message, setMessage] = useState("Fetching M-PESA transactions...");

  // Create the transaction list table
  const createTable = () => {
    db.transaction((txn) => {
      txn.executeSql(
        `CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date INTEGER,
          amount REAL,
          counterpart TEXT,
          type TEXT
        )`,
        [],
        () => {
          console.log('Table created successfully');
        },
        (tx, error) => {
          console.log('Error creating table:', error);
        }
      );
    });
  };

  useEffect(() => {
    createTable();

    if (smsList && smsList.length > 0) {
      setPendingTransactions(0); // Reset pendingTransactions to 0 initially
      extractBalance(smsList);
      changeMessage();
      extractTransactions(smsList); // Process transactions
    } else {
      setNoTransactions(true);
      setIsLoading(false); // No transactions available
    }
  }, [smsList]);

  useEffect(() => {
    // Check if all transactions are processed, then stop loading
    if (pendingTransactions === 0 && !noTransactions) {
      setIsLoading(false);
    }
  }, [pendingTransactions]);

  const changeMessage = () => {
    setTimeout(() => {
      setMessage("Still fetching M-PESA transactions...");
    }, 5000);

    setTimeout(() => {
      setMessage("Almost done fetching M-PESA transactions...");
    }, 10000);

    setTimeout(() => {
      setMessage("Done fetching M-PESA transactions...");
    }, 15000);
  };

  // Insert a transaction if it doesn’t already exist
  const insertTransaction = (transaction) => {
    db.transaction((txn) => {
      txn.executeSql(
        `SELECT * FROM transactions WHERE date = ? `,
        [transaction.date],
        (tx, res) => {
          if (res.rows.length === 0) {
            txn.executeSql(
              `INSERT INTO transactions (date, amount, counterpart, type) VALUES (?, ?, ?, ?)`,
              [transaction.date, transaction.amount, transaction.counterpart, transaction.type],
              (tx, res) => {
                console.log('Transaction inserted successfully');
                setPendingTransactions((prev) => prev - 1); // Decrement when done
              },
              (tx, error) => {
                console.log('Error inserting transaction:', error);
                setPendingTransactions((prev) => prev - 1); // Decrement on error
              }
            );
          } else {
            console.log('Transaction already exists');
            setPendingTransactions((prev) => prev - 1); // Decrement if it already exists
          }
        },
        (tx, error) => {
          console.log('Error checking for existing transaction:', error);
          setPendingTransactions((prev) => prev - 1); // Decrement on error
        }
      );
    });
  };

  const extractBalance = (messages) => {
    const mpesaMessages = messages
      .filter((sms) => sms.address.toLowerCase() === 'mpesa')
      .slice(0, 2); // Get the last two M-PESA messages

    let extractedBalance = 0;

    for (let i = 0; i < mpesaMessages.length; i++) {
      const body = mpesaMessages[i].body;
      const balanceMatch = body.match(/balance is Kshs?(\d{1,3}(,\d{3})*(\.\d{2})?)/i);
      if (balanceMatch) {
        extractedBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));
        break;
      }
    }

    setBalance(extractedBalance);
  };

  const extractTransactions = (messages) => {
    const transactions = [];

    messages.forEach((sms) => {
      if (sms.address.toLowerCase() === 'mpesa') {
        const transaction = parseTransaction(sms);
        if (transaction.amount !== 0 && transaction.counterpart !== null) {
          transactions.push(transaction);
          setPendingTransactions((prev) => prev + 1); // Increment when a transaction is identified
          insertTransaction(transaction);
        }
      }
    });

    if (transactions.length === 0) {
      setIsLoading(false); // No transactions, stop loading
    }
  };

  const parseTransaction = (sms) => {
    const body = sms.body;

    const amountMatch = body.match(/Kshs?(\d{1,3}(,\d{3})*(\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

    let type = null;
    let counterpart = null;

    const typeMatchPairs = [
      { type: 'deduction', pattern: /sent to (.+?) on/ },
      { type: 'deduction', pattern: /paid to (.+?) on/ },
      { type: 'credit', pattern: /received from (.+?) on/ },
      { type: 'credit', pattern: /You have received/ },
      { type: 'deduction', pattern: /You bought (.+?) on/ },
      { type: 'deduction', pattern: /Withdraw Kshs?(\d{1,3}(,\d{3})*(\.\d{2})?) from (.+?) - / },
      { type: 'credit', pattern: /has been credited to your M-PESA account/ },
    ];

    for (const { type: matchType, pattern } of typeMatchPairs) {
      const match = body.match(pattern);
      if (match) {
        type = matchType;
        counterpart = match[1] || body.split(pattern)[1]?.split(' on')[0]?.trim();
        break;
      }
    }

    if (type === 'credit' && !counterpart) {
      const index = body.includes('received from') ? body.indexOf('received from') + 13 : body.indexOf('You have received') + 18;
      counterpart = body.substring(index, body.indexOf(' on', index));
    }

    return {
      date: sms.date,
      amount,
      counterpart,
      type,
    };
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#009900" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    );
  }

  if (noTransactions) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>No M-PESA transactions found.</Text>
      </View>
    );
  }



  return (
    <View style={{ flex: 1 }}>

    <ScrollView>
      <StatusBar barStyle="light-content" backgroundColor="#009900" />
      <Text style={{ textAlign: 'center', fontSize: 17, margin: 17 }}>M-PESA Transactions</Text>
      <View style={{ flex: 1 }}>
        <Targets balance={balance} targetSavings={targetSavings} />
      </View>
      <View style={{ flex: 1 }}>
        <Analysis balance={balance} targetSavings={targetSavings} />
      </View> 
      <View style={{ flex: 1 }}>
        <CashFlowChart />
      </View>
      <View style={{ flex: 1 }}>
        <SummaryChartWeekly />
      </View> 
      <View style={{ flex: 1 }}>
        <SummaryChartMonthly />
      </View>
      <View style={{ flex: 1 }}>
        <SummaryChartYearly />
      </View>
    </ScrollView>
    </View>
  );
};

const styles = {
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
  summaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
};

export default ReadSMS;
