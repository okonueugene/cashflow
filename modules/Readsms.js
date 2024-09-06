import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import SummaryChartMonthly from './SumarryChartMonthly';
import SummaryChartWeekly from './SummaryChartWeekly';
import SummaryChartYearly from './SummaryChartYearly';
import CashFlowChart from './Graphs';
import Analysis from './Analysis';
import Targets from './Targets';

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

const ReadSMS = ({ smsList , targetSavings }) => {
  const [transactionList, setTransactionList] = useState([]);
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [noTransactions, setNoTransactions] = useState(false);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (smsList && smsList.length > 0) {
      extractBalance(smsList);
      extractTransactions(smsList, true);
      extractTransactions(smsList);
    } else {
      setNoTransactions(true);
    }
  }, [smsList]);

  const extractBalance = (messages) => {
    // Look for the last two M-PESA messages containing the word "balance"
    const mpesaMessages = messages
      .filter(sms => sms.address.toLowerCase() === 'mpesa')
      .slice(0, 2); // Get the last two M-PESA messages

    let extractedBalance = 0;

    for (let i = 0; i < mpesaMessages.length; i++) {
      const body = mpesaMessages[i].body;
      const balanceMatch = body.match(/balance is Kshs?(\d{1,3}(,\d{3})*(\.\d{2})?)/i);
      if (balanceMatch) {
        extractedBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));
        break; // Stop once we find the first balance
      }
    }

    setBalance(extractedBalance);
  };

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
      if (transactions.length === 0) {
        setNoTransactions(true);
      }
    }
  };

  const parseTransaction = (sms) => {
    const body = sms.body;
  
    // Extract amount
    const amountMatch = body.match(/Kshs?(\d{1,3}(,\d{3})*(\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
  
    let type = null;
    let counterpart = null;
  
    // Determine type and counterpart
    const typeMatchPairs = [
      { type: 'deduction', pattern: /sent to (.+?) on/ }, // for sent transactions
      { type: 'deduction', pattern: /paid to (.+?) on/ }, // for payments to businesses
      { type: 'credit', pattern: /received from (.+?) on/ }, // for received transactions
      { type: 'credit', pattern: /You have received/ }, // for received transactions 
      { type: 'deduction', pattern: /You bought (.+?) on/ }, // for airtime purchases
      { type: 'deduction', pattern: /Withdraw Kshs?(\d{1,3}(,\d{3})*(\.\d{2})?) from (.+?) - / }, // for withdrawals
      { type: 'credit', pattern: /has been credited to your M-PESA account/ }  // for reversal transactions
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
      date: sms.date,
      amount,
      counterpart,
      type
    };
  };

  if (noTransactions) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>No M-PESA transactions found.</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <Text style={{ textAlign: 'center', fontSize: 20, margin: 20 }}>M-PESA Transactions</Text>
      <View style={{ flex: 1 }}>
        <Targets transactions={transactionList} balance={balance} targetSavings={targetSavings} />
      </View>
      <View style={{ flex: 1 }}>
        <Analysis transactions={transactionList} balance={balance} targetSavings={targetSavings} />
      </View>
      <View style={{ flex: 1 }}>
        <CashFlowChart data={todayTransactions} />
      </View>
      <View style={{ flex: 1 }}>
        <SummaryChartWeekly data={transactionList} />
      </View>
       {/* <View style={{ flex: 1 }}>
        <SummaryChartMonthly data={transactionList} />
      </View>
      <View style={{ flex: 1 }}>
        <SummaryChartYearly data={transactionList} />
      </View>  */}
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