// components/AlertModal.tsx
import React from 'react';

type AlertModalProps = {
  message: string;
  onClose: () => void;
};

export default function AlertModal({ message, onClose }: AlertModalProps) {
  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <p style={{ marginBottom: 20 }}>{message}</p>
        <button onClick={onClose} style={buttonStyle}>OK</button>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999,
};

const boxStyle: React.CSSProperties = {
  background: '#fff',
  padding: '30px 40px',
  borderRadius: 10,
  textAlign: 'center',
  boxShadow: '0 0 10px rgba(0,0,0,0.3)',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#0070f3',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  fontWeight: 'bold',
  cursor: 'pointer',
};
