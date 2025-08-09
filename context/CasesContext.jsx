import React, { createContext, useContext, useState } from 'react';

const CasesContext = createContext();

export const useCasesContext = () => {
  const context = useContext(CasesContext);
  if (!context) {
    throw new Error('useCasesContext must be used within a CasesProvider');
  }
  return context;
};

export const CasesProvider = ({ children }) => {
  const [headerAction, setHeaderAction] = useState(null);

  const setHeaderActionButton = (action) => {
    setHeaderAction(action);
  };

  const clearHeaderAction = () => {
    setHeaderAction(null);
  };

  return (
    <CasesContext.Provider value={{
      headerAction,
      setHeaderActionButton,
      clearHeaderAction,
    }}>
      {children}
    </CasesContext.Provider>
  );
}; 