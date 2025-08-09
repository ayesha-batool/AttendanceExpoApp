import React, { createContext, useContext, useState } from 'react';

const EmployeeContext = createContext();

export const useEmployeeContext = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployeeContext must be used within an EmployeeProvider');
  }
  return context;
};

export const EmployeeProvider = ({ children }) => {
  const [headerAction, setHeaderAction] = useState(null);

  const setHeaderActionButton = (action) => {
    setHeaderAction(action);
  };

  const clearHeaderAction = () => {
    setHeaderAction(null);
  };

  return (
    <EmployeeContext.Provider value={{
      headerAction,
      setHeaderActionButton,
      clearHeaderAction,
    }}>
      {children}
    </EmployeeContext.Provider>
  );
}; 