const analyzeCashFlow = (smsList, filter) => {
    let income = 0;
    let expenses = 0;
  
    smsList.forEach((sms) => {
      const amount = extractAmount(sms.body);
      if (amount) {
        if (filter === 'income' && isIncome(sms.body)) {
          income += amount;
        } else if (filter === 'expenses' && isExpense(sms.body)) {
          expenses += amount;
        }
      }
    });
  
    return { income, expenses };
  };
  
  const extractAmount = (text) => {
    // Implement logic to extract amount from text
    return parseFloat(text.match(/\d+/)[0]);
  };
  
  const isIncome = (text) => {
    // Implement logic to determine if SMS is income
    return text.includes('credited');
  };
  
  const isExpense = (text) => {
    // Implement logic to determine if SMS is expense
    return text.includes('debited');
  };