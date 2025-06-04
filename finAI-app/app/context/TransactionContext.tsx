import React, { createContext, useContext, useState } from 'react';

type TransactionContextType = {
  showNewTransactionModal: boolean;
  setShowNewTransactionModal: (show: boolean) => void;
  newTransactionType: 'income' | 'expense';
  setNewTransactionType: (type: 'income' | 'expense') => void;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<'income' | 'expense'>('expense');

  return (
    <TransactionContext.Provider
      value={{
        showNewTransactionModal,
        setShowNewTransactionModal,
        newTransactionType,
        setNewTransactionType,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
}

// Default export
export default TransactionProvider; 