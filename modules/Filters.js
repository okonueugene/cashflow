import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const FilterOptions = ({ data, onFilterChange }) => {
  const [selectedType, setSelectedType] = useState('all');

  const handleFilterChange = () => {
    onFilterChange({
      type: selectedType,
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
        <Picker.Item label="Income" value="credit" />
        <Picker.Item label="Expenses" value="deduction" />
      </Picker>

      <Button title="Apply Filters" onPress={handleFilterChange} />
    </View>
  );
};

export default FilterOptions;
