import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, PermissionsAndroid, DeviceEventEmitter, Text } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import ReadSMS from './modules/Readsms';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [smsList, setSmsList] = useState([]);

  useEffect(() => {
    requestPermissions();
    return () => {
      // Clean up the SMS listener when the component unmounts
      DeviceEventEmitter.removeAllListeners('onSMSReceived');
    };
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

      const receiveGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: "Receive SMS Permission",
          message: "This app needs permission to listen to incoming SMS messages",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );

      if (readGranted === PermissionsAndroid.RESULTS.GRANTED && receiveGranted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permissions granted");
        fetchSms();
        startSmsListener();
      } else {
        console.log("Permissions denied");
        setIsLoading(false); 
      }
    } catch (err) {
      console.warn(err);
      setIsLoading(false);
    }
  };

  const startSmsListener = () => {
    const subscriber = DeviceEventEmitter.addListener(
      'onSMSReceived',
      message => {
        const { messageBody, senderPhoneNumber } = JSON.parse(message);
        console.log('Received SMS:', messageBody, 'from', senderPhoneNumber);

        // If the sender is mpesa, then fetch the sms messages again
        if (senderPhoneNumber.toLowerCase().includes('mpesa')) {
          fetchSms(); // Re-fetch if it's an M-PESA message
          console.log('Fetching SMS messages again...');
        } else {
          // Add the new message to the list
          setSmsList(prevState => [...prevState, { body: messageBody, address: senderPhoneNumber }]);
        }
      },
    );

    return () => {
      subscriber.remove();
    };
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
        setIsLoading(false); 
      },
      (count, smsList) => {
        const messages = JSON.parse(smsList);
        setSmsList(messages);
        setIsLoading(false); 
      },
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading SMS messages...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ReadSMS smsList={smsList} />
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
};

export default App;