import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import ReadSMS from './modules/Readsms';
import FilterOptions from './modules/Filters';
import CashFlowChart from './modules/Graphs';

const App = () => {
  const [smsList, setSmsList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [cashFlow, setCashFlow] = useState({ income: 0, expenses: 0 });

  useEffect(() => {
    if (smsList.length > 0) {
      const analysis = analyzeCashFlow(smsList, filter);
      setCashFlow(analysis);
    }
  }, [smsList, filter]);

  const handleFilterChange = (filter) => {
    setFilter(filter);
  };

  return (
    <View>
      <FilterOptions onFilterChange={handleFilterChange} />
      <ReadSMS onSmsLoad={setSmsList} />
      <CashFlowChart income={cashFlow.income} expenses={cashFlow.expenses} />
    </View>
  );
};

export default App;