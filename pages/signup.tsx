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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div style={{ width: '100%', maxWidth: 400, padding: 20, textAlign: 'center' }}>
          <h1 style={{ marginBottom: 20 }}>新規登録</h1>

          <input
            type="text"
            placeholder="ニックネーム"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => checkEmailDuplicate(email)}
            style={inputStyle}
          />
          {emailError && <div style={{ color: 'red', marginBottom: 12, fontSize: '0.8rem' }}>{emailError}</div>}

          <input
            type="password"
            placeholder="パスワード (6文字以上)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="パスワード確認"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />

          <button onClick={handleSignUp} style={signupButtonStyle}>新規登録</button>
        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  marginBottom: 12,
  fontSize: '1rem',
  borderRadius: 6,
  border: '1px solid #ccc',
};

const signupButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  fontSize: '1rem',
  backgroundColor: '#00c471',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};
