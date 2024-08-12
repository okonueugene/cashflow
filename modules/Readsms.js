import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import SummaryChartMonthly from './SumarryChartMonthly';
import SummaryChartWeekly from './SummaryChartWeekly';
import SummaryChartYearly from './SummaryChartYearly';
import CashFlowChart from './Graphs';

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

const ReadSMS = ({ smsList }) => {
  const [transactionList, setTransactionList] = useState([]);
  const [todayTransactions, setTodayTransactions] = useState([]);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (smsList && smsList.length > 0) {
      extractTransactions(smsList, true);  
      extractTransactions(smsList);       
    }
  }, [smsList]);

  const extractTransactions = (messages, filterByToday = false) => {
    const currentDate = new Date();
    let startOfDay, endOfDay;

    if (filterByToday) {
      startOfDay = new Date(currentDate).setHours(0, 0, 0, 0);
      endOfDay = new Date(currentDate).setHours(23, 59, 59, 999);
    }

    const transactions = [];

    messages.forEach(sms => {
      if (sms.address.toLowerCase() === 'mpesa') {
        const smsDate = new Date(sms.date);
        if (!filterByToday || (smsDate >= startOfDay && smsDate <= endOfDay)) {
          const transaction = parseTransaction(sms);
          if (transaction.amount !== null && transaction.counterpart !== undefined) {
            transactions.push(transaction);
          }
        }
      }
    });

    if (filterByToday) {
      setTodayTransactions(transactions);
    } else {
      setTransactionList(transactions);
      // setLoading(false);
    }
  };

  const parseTransaction = (sms) => {
    const body = sms.body;

    // Extract amount
    const amountMatch = body.match(/Ksh(\d{1,3}(,\d{3})*(\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

    let type = null;
    let counterpart = null;

    // Determine type and counterpart
    const typeMatchPairs = [
      { type: 'deduction', pattern: /sent to (.+?) on/ },
      { type: 'deduction', pattern: /paid to (.+?) on/ },
      { type: 'credit', pattern: /received from (.+?) on/ },
      { type: 'credit', pattern: /You have received/ }, 
      { type: 'deduction', pattern: /You bought (.+?) on/ }
    ];

    for (const { type: matchType, pattern } of typeMatchPairs) {
      const match = body.match(pattern);
      if (match) {
        type = matchType;
        counterpart = match[1] || body.split(pattern)[1]?.split(' on')[0]?.trim();
        break;
      }
    }

    // Fallback for received cases not covered by regex
    if (type === 'credit' && !counterpart) {
      const index = body.includes('received from') ? body.indexOf('received from') + 13 : body.indexOf('You have received') + 18;
      counterpart = body.substring(index, body.indexOf(' on', index));
    }

    return {
      id: sms._id,
      date: new Date(sms.date).toLocaleString(),
      amount,
      counterpart,
      type
    };
  };

  // if (loading) {
  //   // Show loading indicator while processing transactions
  //   return (
  //     <View style={styles.center}>
  //       <ActivityIndicator size="large" color="#0000ff" />
  //       <Text style={styles.loadingText}>Processing transactions...</Text>
  //     </View>
  //   );
  // }

  return (
    <ScrollView>
      <Text style={{ textAlign: 'center', fontSize: 20, margin: 20 }}>M-PESA Transactions</Text>
      <View style={{ flex: 1 }}>
        <CashFlowChart data={todayTransactions} />
      </View>
      <View style={{ flex: 1 }}>
        <SummaryChartWeekly data={transactionList} />
      </View>
      <View style={{ flex: 1 }}>
        <SummaryChartMonthly data={transactionList} />
      </View>
      <View style={{ flex: 1 }}>
        <SummaryChartYearly data={transactionList} />
        </View>

    </ScrollView>
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
