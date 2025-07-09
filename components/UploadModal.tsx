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
  width: 300,
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

const progressBarOuterStyle: React.CSSProperties = {
  width: '100%',
  height: '12px',
  backgroundColor: '#eee',
  borderRadius: '8px',
  marginTop: '16px',
  overflow: 'hidden',
};

const globalStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

interface UploadModalProps {
  visible: boolean;
  message?: string;
  progress?: number; // 0 ~ 100
}

export default function UploadModal({ visible, message = "少々お待ちください。", progress = 0 }: UploadModalProps) {
  if (!visible) return null;

  return (
    <>
      <style>{globalStyle}</style>
      <div style={modalOverlayStyle}>
        <div style={modalBoxStyle}>
          <div style={spinnerStyle}></div>
          <p style={{ fontWeight: 'bold', color: '#333', marginBottom: 10 }}>{message}</p>

          <div style={progressBarOuterStyle}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#0070f3',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
