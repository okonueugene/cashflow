const getHighestAndFrequentTransactions = (smsList) => {
    const transactions = {};
  
    smsList.forEach((sms) => {
      const amount = extractAmount(sms.body);
      const type = isIncome(sms.body) ? 'income' : isExpense(sms.body) ? 'expense' : 'other';
  
      if (amount && type !== 'other') {
        if (!transactions[type]) {
          transactions[type] = [];
        }
        transactions[type].push(amount);
      }
    });
  
    const highestIncome = Math.max(...(transactions.income || []));
    const highestExpense = Math.max(...(transactions.expense || []));
    const frequentIncome = mostFrequent(transactions.income || []);
    const frequentExpense = mostFrequent(transactions.expense || []);
  
    return { highestIncome, highestExpense, frequentIncome, frequentExpense };
  };
  
  const mostFrequent = (array) => {
    const frequency = {};
    let max = 0;
    let result = null;
  
    array.forEach((value) => {
      frequency[value] = (frequency[value] || 0) + 1;
      if (frequency[value] > max) {
        max = frequency[value];
        result = value;
      }
    });
  
    return result;
  };