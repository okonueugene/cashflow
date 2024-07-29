import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Helper function to get unique values from an array of objects
const getUniqueValues = (data = [], key) => {
  if (Array.isArray(data)) {
    return [...new Set(data.map(item => item[key]))];
  }
  return [];
};

const FilterOptions = ({ data = [], onFilterChange }) => {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCounterpart, setSelectedCounterpart] = useState('');
  
  const [dates, setDates] = useState([]);
  const [counterparts, setCounterparts] = useState([]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Extract unique dates and counterparts from the data
      const uniqueDates = getUniqueValues(data, 'date');
      const uniqueCounterparts = getUniqueValues(data, 'counterpart');

      setDates(uniqueDates);
      setCounterparts(uniqueCounterparts);
    }
  }, [data]);

  const handleFilterChange = () => {
    onFilterChange({
      type: selectedType,
      date: selectedDate,
      counterpart: selectedCounterpart
    });
  };

  return (
    <View>
      <Text>Select Type:</Text>
      <Picker
        selectedValue={selectedType}
        onValueChange={(itemValue) => setSelectedType(itemValue)}
      >
        <Picker.Item label="All" value="all" />
        <Picker.Item label="Income" value="income" />
        <Picker.Item label="Expenses" value="expenses" />
      </Picker>

      <Text>Select Date:</Text>
      <Picker
        selectedValue={selectedDate}
        onValueChange={(itemValue) => setSelectedDate(itemValue)}
      >
        <Picker.Item label="All Dates" value="" />
        {dates.map((date, index) => (
          <Picker.Item key={index} label={new Date(date).toLocaleDateString()} value={date} />
        ))}
      </Picker>

      <Text>Select Counterpart:</Text>
      <Picker
        selectedValue={selectedCounterpart}
        onValueChange={(itemValue) => setSelectedCounterpart(itemValue)}
      >
        <Picker.Item label="All Counterparts" value="" />
        {counterparts.map((counterpart, index) => (
          <Picker.Item key={index} label={counterpart} value={counterpart} />
        ))}
      </Picker>

      <Button title="Apply Filters" onPress={handleFilterChange} />
    </View>
  );
};

export default FilterOptions;
