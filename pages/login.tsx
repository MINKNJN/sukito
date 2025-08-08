// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (loading) return;
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('両方入力してください。');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('正しいメールアドレスの形式で入力してください。');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.clear();

        const expire = Date.now() + 1000 * 60 * 60 * 24 * 7; 
      
        localStorage.setItem('token', data.token); 
        localStorage.setItem('userId', JSON.stringify({ value: data.userId, expire }));
        localStorage.setItem('nickname', JSON.stringify({ value: data.nickname, expire }));
        localStorage.setItem('email', JSON.stringify({ value: data.email, expire }));
        localStorage.setItem('role', JSON.stringify({ value: data.role || 'user', expire }));
      
        const nextPath = router.query.next as string || '/';
        router.push(nextPath);
      }
       else {
        setErrorMessage(data.message || 'ログインに失敗しました。');
      }
    } catch (err) {
      setErrorMessage('エラー');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignup = () => {
    router.push('/signup');
  };

  return (
    <>
      <Header />
      <div style={{ background: 'linear-gradient(120deg, #f8fafc 0%, #e6f7ff 100%)', minHeight: '100dvh', width: '100vw', padding: 0, margin: 0 }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
          padding: '32px 24px',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 24px #b2ebf222',
          border: '1.5px solid #e0f7fa',
          textAlign: 'center',
          margin: '48px auto 0 auto',
          position: 'relative',
        }}>
          <h1 style={{ marginBottom: 24, fontWeight: 700, fontSize: 28, letterSpacing: -1, color: '#4caf50', fontFamily: 'inherit' }}>ログイン</h1>

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              marginBottom: 16,
              fontSize: '1rem',
              borderRadius: 10,
              border: '1.5px solid #b2ebf2',
              background: '#f7fafd',
              color: '#222',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
              boxShadow: '0 1px 4px #b2ebf222',
              display: 'block',
            }}
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              marginBottom: 16,
              fontSize: '1rem',
              borderRadius: 10,
              border: '1.5px solid #b2ebf2',
              background: '#f7fafd',
              color: '#222',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
              boxShadow: '0 1px 4px #b2ebf222',
              display: 'block',
            }}
          />

          {errorMessage && <p style={{ color: '#d94350', marginBottom: 16, fontWeight: 600 }}>{errorMessage}</p>}

          <button onClick={handleLogin} style={{
            width: '100%',
            padding: 14,
            fontSize: '1.1rem',
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            marginBottom: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            boxShadow: '0 2px 8px #4caf5022',
            transition: 'background 0.2s',
            opacity: loading ? 0.7 : 1,
          }} disabled={loading}>
            {loading ? 'ログイン 中...' : 'ログイン'}
          </button>
          <button onClick={handleGoToSignup} style={{
            width: '100%',
            padding: 14,
            fontSize: '1.1rem',
            backgroundColor: '#fff',
            color: '#4caf50',
            border: '2px solid #4caf50',
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 700,
            boxShadow: '0 1px 4px #b2ebf222',
            transition: 'background 0.2s, color 0.2s',
          }}>新規登録</button>
        </div>
      </div>
    </>
  );
}


  const linkButtonStyle: React.CSSProperties = {
    padding: '6px 6px',
    borderRadius: '6px',
    backgroundColor: '#f0f0f0',
    color: '#1565c0',
    fontWeight: 500,
    fontSize: '0.7rem',
    textDecoration: 'none',
    border: '1px solid #ccc',
    transition: 'background-color 0.2s',
  };

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  marginBottom: 12,
  fontSize: '1rem',
  borderRadius: 6,
  border: '1px solid #ccc',
};

const loginButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  fontSize: '1rem',
  backgroundColor: '#00c471',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  marginBottom: 10,
  cursor: 'pointer',
};

const signupButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  fontSize: '1rem',
  backgroundColor: 'white',
  color: '#00c471',
  border: '2px solid #00c471',
  borderRadius: 6,
  cursor: 'pointer',
};