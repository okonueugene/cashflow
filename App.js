import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, PermissionsAndroid, DeviceEventEmitter, Text, TextInput, Button, Alert } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReadSMS from './modules/Readsms';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [smsList, setSmsList] = useState([]);
  const [targetSavings, setTargetSavings] = useState('');
  const [isTargetSet, setIsTargetSet] = useState(false);

  useEffect(() => {
    loadTargetSavings();
    requestPermissions();
    return () => {
      DeviceEventEmitter.removeAllListeners('onSMSReceived');
    };
  }, []);

  const loadTargetSavings = async () => {
    try {
      const savedTarget = await AsyncStorage.getItem('targetSavings');
      if (savedTarget !== null) {
        setTargetSavings(savedTarget);
        setIsTargetSet(true);
      }
    } catch (error) {
      console.warn('Failed to load target savings from AsyncStorage', error);
    }
  };

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
        if (senderPhoneNumber.toLowerCase().includes('mpesa')) {
          fetchSms();
          console.log('Fetching SMS messages again...');
        } else {
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

  const handleSetTarget = async () => {
    if (targetSavings === '') {
      Alert.alert('Error', 'Please enter a target savings amount');
    } else {
      try {
        await AsyncStorage.setItem('targetSavings', targetSavings);
        setIsTargetSet(true);
      } catch (error) {
        console.warn('Failed to save target savings to AsyncStorage', error);
      }
    }
  };

  if (!isTargetSet) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Enter your target savings amount:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g., 10000"
          value={targetSavings}
          onChangeText={setTargetSavings}
        />
        <Button title="Set Target" onPress={handleSetTarget} />
      </View>
    );
  }

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
      <ReadSMS smsList={smsList} targetSavings={targetSavings} />
    </View>
  );
};

const styles = {
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'gray',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
};

export default App;
