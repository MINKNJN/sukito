// lib/alert.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertState {
  message: string;
  type: AlertType;
  isVisible: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
  hideAlert: () => void;
  alertState: AlertState;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alertState, setAlertState] = useState<AlertState>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showAlert = (message: string, type: AlertType = 'info') => {
    setAlertState({
      message,
      type,
      isVisible: true,
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
    setAlertState({
      message,
      type: 'warning',
      isVisible: true,
      onConfirm,
      onCancel,
      showCancel: true,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({
      ...prev,
      isVisible: false,
    }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, hideAlert, alertState }}>
      {children}
      <AlertModal />
    </AlertContext.Provider>
  );
}

function AlertModal() {
  const { alertState, hideAlert } = useAlert();
  const { message, type, isVisible, onConfirm, onCancel, showCancel } = alertState;

  if (!isVisible) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    hideAlert();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    hideAlert();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4caf50',
          color: '#fff',
          borderColor: '#4caf50',
        };
      case 'warning':
        return {
          backgroundColor: '#ff9800',
          color: '#fff',
          borderColor: '#ff9800',
        };
      case 'error':
        return {
          backgroundColor: '#f44336',
          color: '#fff',
          borderColor: '#f44336',
        };
      default:
        return {
          backgroundColor: '#0070f3',
          color: '#fff',
          borderColor: '#0070f3',
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={iconStyle}>
          {type === 'success' && '✅'}
          {type === 'warning' && '⚠️'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
        </div>
        <p style={messageStyle}>{message}</p>
        <div style={buttonContainerStyle}>
          {showCancel && (
            <button onClick={handleCancel} style={cancelButtonStyle}>
              キャンセル
            </button>
          )}
          <button 
            onClick={showCancel ? handleConfirm : hideAlert} 
            style={{
              ...confirmButtonStyle,
              ...typeStyles,
            }}
          >
            {showCancel ? '確認' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  padding: '30px 40px',
  borderRadius: 18,
  textAlign: 'center',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  maxWidth: '90%',
  width: 400,
  border: '1.5px solid #e0f7fa',
};

const iconStyle: React.CSSProperties = {
  fontSize: '3rem',
  marginBottom: '16px',
};

const messageStyle: React.CSSProperties = {
  marginBottom: '24px',
  fontSize: '1.1rem',
  color: '#333',
  lineHeight: '1.5',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
};

const confirmButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  border: 'none',
  borderRadius: 10,
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  transition: 'all 0.2s',
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#f7fafd',
  border: '1.5px solid #b2ebf2',
  borderRadius: 10,
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  color: '#666',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  transition: 'all 0.2s',
}; 