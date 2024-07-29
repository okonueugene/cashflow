import React, { useEffect, useState } from 'react';
import { View, Text, Button, PermissionsAndroid, Alert } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import RNFS from 'react-native-fs';
import FilterOptions from './Filters';

const ReadSMS = () => {
  const [smsList, setSmsList] = useState([]);
  const [transactionList, setTransactionList] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

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
        maxCount: 308,
      }),
      (fail) => {
        console.log('Failed with this error: ' + fail);
      },
      (count, smsList) => {
        const messages = JSON.parse(smsList);
        setSmsList(messages);
        extractTransactions(messages);
      },
    );
  };

  const extractTransactions = (messages) => {
    const currentDate = new Date();
    const daysLimit = 40;
    const millisecondsInADay = 24 * 60 * 60 * 1000;
    const dateLimit = new Date(currentDate.getTime() - daysLimit * millisecondsInADay);

    const transactions = messages
      .filter(sms => sms.address.toLowerCase() === 'mpesa')
      .filter(sms => new Date(sms.date) >= dateLimit)
      .map(sms => {
        const body = sms.body;
        let amountMatch = body.match(/Ksh(\d+(\.\d{2})?)/);
        let amount = amountMatch ? parseFloat(amountMatch[1]) : null;
        let type, counterpart;

        if (body.includes('sent to')) {
          type = 'deduction';
          const match = body.match(/sent to (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('sent to') + 8, body.indexOf(' on'));
        } else if (body.includes('paid to')) {
          type = 'deduction';
          const match = body.match(/paid to (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('paid to') + 8, body.indexOf(' on'));
        } else if (body.includes('You have received')) {
          type = 'credit';
          const match = body.match(/from (.+?) on/);
          counterpart = match ? match[1] : body.substring(body.indexOf('from') + 5, body.indexOf(' on'));
        }

        return {
          id: sms._id,
          date: new Date(sms.date).toLocaleDateString(),
          amount,
          counterpart,
          type
        };
      }).filter(transaction => transaction.amount !== null && transaction.counterpart !== undefined);

    setTransactionList(transactions);
    setFilteredTransactions(transactions); // Set filtered transactions initially
  };

  const handleFilterChange = (filters) => {
    const { type, date, counterpart } = filters;
    const filtered = transactionList.filter(transaction => {
      const typeMatch = type === 'all' || transaction.type === type;
      const dateMatch = !date || transaction.date === new Date(date).toLocaleDateString();
      const counterpartMatch = !counterpart || transaction.counterpart === counterpart;

      return typeMatch && dateMatch && counterpartMatch;
    });

    setFilteredTransactions(filtered);
  };

  const downloadJSON = () => {
    const path = RNFS.DownloadDirectoryPath + '/transaction_list.json';

    RNFS.writeFile(path, JSON.stringify(transactionList, null, 2), 'utf8')
      .then(() => {
        console.log('JSON file created at: ' + path);
        Alert.alert('Success', 'JSON file created at: ' + path);
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  return (
    <View>
      <Text>SMS Messages fetched and filtered in the background.</Text>
      <Text>Total Messages: {smsList.length}</Text>
      <Text>Total Transactions: {transactionList.length} from the last 40 days</Text>
      <Button title="Fetch SMS" onPress={fetchSms} />
      <Button title="Download JSON" onPress={downloadJSON} />

      <FilterOptions data={transactionList} onFilterChange={handleFilterChange} />

      {filteredTransactions.length > 0 && (
        <>
          <Text>Filtered Transactions:</Text>
          {filteredTransactions.map((transaction, index) => (
            <Text key={index}>{transaction.type} of Ksh{transaction.amount} to/from {transaction.counterpart} on {transaction.date}</Text>
          ))}
        </>
      )}
    </View>
  );
};

export default ReadSMS;
