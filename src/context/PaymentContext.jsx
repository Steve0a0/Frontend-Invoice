import { createContext, useContext, useState, useEffect } from "react";

const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const [paymentManagementEnabled, setPaymentManagementEnabled] = useState(() => {
    const saved = localStorage.getItem("paymentManagementEnabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("paymentManagementEnabled", JSON.stringify(paymentManagementEnabled));
  }, [paymentManagementEnabled]);

  const togglePaymentManagement = () => {
    setPaymentManagementEnabled(prev => !prev);
  };

  return (
    <PaymentContext.Provider value={{ paymentManagementEnabled, setPaymentManagementEnabled, togglePaymentManagement }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePaymentManagement() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePaymentManagement must be used within PaymentProvider");
  }
  return context;
}

