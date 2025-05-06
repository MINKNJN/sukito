// components/UploadModal.tsx
import React from 'react';

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const modalBoxStyle: React.CSSProperties = {
  background: 'white',
  padding: '30px 40px',
  borderRadius: '10px',
  textAlign: 'center',
  boxShadow: '0 0 10px rgba(0,0,0,0.3)',
};

const spinnerStyle: React.CSSProperties = {
  border: '6px solid #f3f3f3',
  borderTop: '6px solid #0070f3',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  animation: 'spin 1s linear infinite',
  margin: '20px auto',
};

const globalStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export default function UploadModal({ visible, message = "少々お待ちください。" }: { visible: boolean; message?: string }) {
  if (!visible) return null;
  return (
    <>
      <style>{globalStyle}</style>
      <div style={modalOverlayStyle}>
        <div style={modalBoxStyle}>
          <div style={spinnerStyle}></div>
          <p style={{ fontWeight: 'bold', color: '#333' }}>{message}</p>
        </div>
      </div>
    </>
  );
}
