// pages/signup.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';

export default function SignUpPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);

  const checkEmailDuplicate = async (emailToCheck: string) => {
    if (!/\S+@\S+\.\S+/.test(emailToCheck)) {
      setEmailError('正しいメールアドレスの形式で入力してください。');
      setIsEmailValid(false);
      return;
    }

    try {
      const res = await fetch(`/api/check-email?email=${encodeURIComponent(emailToCheck)}`);
      const data = await res.json();
      if (res.ok) {
        if (data.exists) {
          setEmailError('このメールアドレスは既に使用されています。');
          setIsEmailValid(false);
        } else {
          setEmailError('');
          setIsEmailValid(true);
        }
      } else {
        setEmailError(data.message || 'メールアドレスの確認に失敗');
        setIsEmailValid(false);
      }
    } catch (err) {
      console.error('メールアドレスの重複確認に失敗:', err);
      setEmailError('SERVER ERROR');
      setIsEmailValid(false);
    }
  };

  const handleSignUp = async () => {
    if (!nickname.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      alert('すべての項目を入力してください。');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      alert('正しいメールアドレスの形式で入力してください。');
      return;
    }

    if (!isEmailValid) {
      alert('使用できないメールアドレスです。');
      return;
    }

    if (password.length < 6) {
      alert('パスワードは6文字以上で入力してください。');
      return;
    }

    if (password !== confirmPassword) {
      alert('パスワードが一致しません。');
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, email, password }),
      });

      if (res.ok) {
        alert('登録が完了しました。');
        router.push('/login');
      } else {
        const errorData = await res.json();
        alert(`ERROR: ${errorData.message}`);
      }
    } catch (err) {
      console.error('ERROR', err);
      alert('SERVER ERROR');
    }
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
          <h1 style={{ marginBottom: 24, fontWeight: 700, fontSize: 28, letterSpacing: -1, color: '#4caf50', fontFamily: 'inherit' }}>新規登録</h1>

          <input
            type="text"
            placeholder="ニックネーム"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
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
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => checkEmailDuplicate(email)}
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
          {emailError && <div style={{ color: '#d94350', marginBottom: 12, fontSize: '0.9rem', fontWeight: 600 }}>{emailError}</div>}

          <input
            type="password"
            placeholder="パスワード (6文字以上)"
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

          <input
            type="password"
            placeholder="パスワード確認"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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

          <button onClick={handleSignUp} style={{
            width: '100%',
            padding: 14,
            fontSize: '1.1rem',
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            marginBottom: 8,
            cursor: 'pointer',
            fontWeight: 700,
            boxShadow: '0 2px 8px #4caf5022',
            transition: 'background 0.2s',
          }}>新規登録</button>
        </div>
      </div>
    </>
  );
}
