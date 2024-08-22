import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, PermissionsAndroid, DeviceEventEmitter, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SmsAndroid from 'react-native-get-sms-android';
import ReadSMS from './modules/Readsms';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [smsList, setSmsList] = useState([]);

  useEffect(() => {
    initializeApp();
    return () => {
      DeviceEventEmitter.removeAllListeners('onSMSReceived');
    };
  }, []);

  const initializeApp = async () => {
    await requestPermissions();
    const storedSmsList = await AsyncStorage.getItem('smsList');
    if (storedSmsList) {
      setSmsList(JSON.parse(storedSmsList));
      setIsLoading(false);
    } else {
      fetchSms();
    }
    startSmsListener();
  };

  const requestPermissions = async () => {
    try {
      const readGranted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
      const receiveGranted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);

      if (readGranted !== PermissionsAndroid.RESULTS.GRANTED || receiveGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permissions denied");
        setIsLoading(false);
      }
    } catch (err) {
      console.warn(err);
      setIsLoading(false);
    }
  };

  const startSmsListener = () => {
    DeviceEventEmitter.addListener('onSMSReceived', async message => {
      const { messageBody, senderPhoneNumber } = JSON.parse(message);
      console.log('Received SMS:', messageBody, 'from', senderPhoneNumber);

      if (senderPhoneNumber.toLowerCase().includes('mpesa')) {
        const newSms = { body: messageBody, address: senderPhoneNumber };
        const updatedSmsList = [...smsList, newSms];
        setSmsList(updatedSmsList);
        await AsyncStorage.setItem('smsList', JSON.stringify(updatedSmsList));
      }
    });
  };

  const fetchSms = () => {
    SmsAndroid.list(
      JSON.stringify({ box: 'inbox', indexFrom: 0, maxCount: 9999 }),
      (fail) => {
        console.log('Failed with this error: ' + fail);
        setIsLoading(false);
      },
      async (count, smsList) => {
        const messages = JSON.parse(smsList);
        const filteredMessages = messages.filter(msg => msg.address.toLowerCase().includes('mpesa'));
        setSmsList(filteredMessages);
        await AsyncStorage.setItem('smsList', JSON.stringify(filteredMessages));
        setIsLoading(false);
      },
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
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

