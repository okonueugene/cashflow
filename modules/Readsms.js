import React, { useEffect, useState } from 'react';
import { View, Text, Button, PermissionsAndroid, Alert, ScrollView } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import RNFS from 'react-native-fs';
import SummaryChart from './SummaryChart';
import CashFlowChart from './Graphs';

const ReadSMS = () => {
  const [smsList, setSmsList] = useState([]);
  const [transactionList, setTransactionList] = useState([]);
  const [todayTransactions, setTodayTransactions] = useState([]);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const readGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Permission",
          message: "This app needs access to your SMS messages",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );

      const writeGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Write Permission",
          message: "This app needs access to your storage to save the JSON file",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );

      if (readGranted === PermissionsAndroid.RESULTS.GRANTED && writeGranted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permissions granted");
        fetchSms();
      } else {
        console.log("Permissions denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const fetchSms = () => {
    SmsAndroid.list(
      JSON.stringify({
        box: 'inbox',
        indexFrom: 0,
        maxCount: 9999,
      }),
      (fail) => {
        console.log('Failed with this error: ' + fail);
      },
      (count, smsList) => {
        const messages = JSON.parse(smsList);
        setSmsList(messages);
        extractTransactions(messages);
        extractTodayTransactions(messages);
      },
    );
  };

  const extractTodayTransactions = (messages) => {
 // // Specify the date and time range

const currentDate = new Date();

const startOfDay = new Date(currentDate);
 
 startOfDay.setHours(0, 0, 0, 0); // 00:00:00
 
 const endOfDay = new Date(currentDate);
 
endOfDay.setHours(23, 59, 59, 999); // 23:59:59
 
    const todayTransactions = messages
      .filter(sms => sms.address.toLowerCase() === 'mpesa') // Only M-PESA transactions
      .filter(sms => new Date(sms.date) >= startOfDay && new Date(sms.date) <= endOfDay)
      .map(sms => {
        const body = sms.body;
        let amountMatch = body.match(/Ksh(\d{1,3}(,\d{3})*(\.\d{2})?)/);
        let amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
        let type, counterpart;
  
        if (body.includes('sent to')) {
          type = 'deduction';
          const match = body.match(/sent to (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('sent to') + 8, body.indexOf(' on'));
        } else if (body.includes('paid to')) {
          type = 'deduction';
          const match = body.match(/paid to (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('paid to') + 8, body.indexOf(' on'));
        } else if (body.includes('You have received') || body.includes('received from')) {
          type = 'credit';
          const match = body.match(/from (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('from') + 5, body.indexOf(' on'));
        } else if (body.includes('You bought')) {
          type = 'deduction';
          const match = body.match(/You bought (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('You bought') + 10, body.indexOf(' on'));
        }
  
        return {
          id: sms._id,
          date: new Date(sms.date).toLocaleString(),
          amount,
          counterpart,
          type
        };
      }
      )
      .filter(transaction => transaction.amount !== null && transaction.counterpart !== undefined);

    setTodayTransactions(todayTransactions);
  };


  const extractTransactions = (messages) => {
   
    // Filter and map transactions
    const transactions = messages
      .filter(sms => sms.address.toLowerCase() === 'mpesa') // Only M-PESA transactions
      .map(sms => {
        const body = sms.body;
        let amountMatch = body.match(/Ksh(\d{1,3}(,\d{3})*(\.\d{2})?)/);
        let amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
        let type, counterpart;
  
        if (body.includes('sent to')) {
          type = 'deduction';
          const match = body.match(/sent to (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('sent to') + 8, body.indexOf(' on'));
        } else if (body.includes('paid to')) {
          type = 'deduction';
          const match = body.match(/paid to (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('paid to') + 8, body.indexOf(' on'));
        } else if (body.includes('You have received') || body.includes('received from')) {
          type = 'credit';
          const match = body.match(/from (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('from') + 5, body.indexOf(' on'));
        } else if (body.includes('You bought')) {
          type = 'deduction';
          const match = body.match(/You bought (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('You bought') + 10, body.indexOf(' on'));
        }
  
        return {
          id: sms._id,
          date: new Date(sms.date).toLocaleString(),
          amount,
          counterpart,
          type
        };
      })
      .filter(transaction => transaction.amount !== null && transaction.counterpart !== undefined);
  
    setTransactionList(transactions);
  };
  
  // const outputDir =  RNFS.DownloadDirectoryPath + '/transaction_list.json';

  // const downloadJSON = () => {
  //   RNFS.writeFile(outputDir, JSON.stringify(transactionList, null, 2), 'utf8')
  //     .then(() => {
  //       Alert.alert('Success', 'JSON file saved to ' + outputDir);
  //     })
  //     .catch((err) => {
  //       console.log(err.message);
  //       Alert.alert('Error', 'Failed to save JSON file');
  //     }
  //   );
  // };

  // const downloadMessages = () => {
  //   RNFS.writeFile(RNFS.DownloadDirectoryPath + '/sms_list.json', JSON.stringify(smsList, null, 2), 'utf8')
  //     .then(() => {
  //       Alert.alert('Success', 'JSON file saved to ' + RNFS.DownloadDirectoryPath + '/sms_list.json');
  //     })
  //     .catch((err) => {
  //       console.log(err.message);
  //       Alert.alert('Error', 'Failed to save JSON file');
  //     }
  //   );
  // };




  return (
    <ScrollView>
      <Text style={{ textAlign: 'center', fontSize: 20, margin: 20 }}>M-PESA Transactions</Text>
      <CashFlowChart data={todayTransactions} />

      <SummaryChart data={transactionList} />
   
    </ScrollView>
  );
};

export default ReadSMS;