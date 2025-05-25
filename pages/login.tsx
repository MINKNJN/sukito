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
      console.error('ログイン エラー:', err);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div style={{ width: '100%', maxWidth: 400, padding: 20, textAlign: 'center' }}>
          <h1 style={{ marginBottom: 20 }}>ログイン</h1>

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          {errorMessage && <p style={{ color: 'red', marginBottom: 12 }}>{errorMessage}</p>}

          <button onClick={handleLogin} style={loginButtonStyle} disabled={loading}>
            {loading ? 'ログイン 中...' : 'ログイン'}
          </button>
          <button onClick={handleGoToSignup} style={signupButtonStyle}>新規登録</button>
          
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