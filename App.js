import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, PermissionsAndroid, StyleSheet,Text } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import ReadSMS from './modules/Readsms';
import SmsListener from 'react-native-android-sms-listener';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [smsList, setSmsList] = useState([]);

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

     

      if (readGranted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permissions granted");
        fetchSms();
      } else {
        console.log("Permissions denied");
        setIsLoading(false); 
      }
    } catch (err) {
      console.warn(err);
      setIsLoading(false);
    }
  };


  SmsListener.addListener(message => {
    console.info(message)
  });
  
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
  summaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
};


export default App;