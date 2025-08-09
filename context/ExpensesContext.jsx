import React, { createContext, useContext, useState } from 'react';

const ExpensesContext = createContext();

export const useExpensesContext = () => {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error('useExpensesContext must be used within an ExpensesProvider');
  }
  return context;
};

export const ExpensesProvider = ({ children }) => {
  const [headerAction, setHeaderAction] = useState(null);

  const setHeaderActionButton = (action) => {
    setHeaderAction(action);
  };

  const clearHeaderAction = () => {
    setHeaderAction(null);
  };

  return (
    <ExpensesContext.Provider value={{
      headerAction,
      setHeaderActionButton,
      clearHeaderAction,
    }}>
      {children}
    </ExpensesContext.Provider>
  );
}; 