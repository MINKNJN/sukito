// pages/profile.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('ログインしてください。');
      router.push('/login');
      return;
    }
  
    fetch('/api/jwt', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (!data.userId || !data.email || !data.nickname) {
          alert('ログインしてください。');
          localStorage.clear();
          router.push('/login');
          return;
        }
    
        setEmail(data.email);
        setNickname(data.nickname);
      })
      .catch((err) => {
        console.error('JWT エラー:', err);
        alert('エラー');
        localStorage.clear();
        router.push('/login');
      });
  }, [router]);
  

  const handleUpdate = async () => {
    if (!currentPassword) {
      alert('パスワードを入力してください。');
      return;
    }
  
    if (changePassword && newPassword !== confirmPassword) {
      alert('新しいパスワードが一致しません。');
      return;
    }
  
    const userId = localStorage.getItem('userId') 
      ? JSON.parse(localStorage.getItem('userId') || '{}').value 
      : '';
  
    if (!userId) {
      alert('ログインしてください。');
      router.push('/login');
      return;
    }
  
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword,
          nickname,
          newPassword: changePassword ? newPassword : undefined,
        }),
      });
  
      const data = await res.json();
      if (res.ok) {
        alert('情報が変更されました。');
        localStorage.clear();
        router.push('/login');
      } else {
        alert(data.message || 'リクエスト失敗');
      }
    } catch (err) {
      console.error(err);
      alert('ネットワークエラー');
    }
  };
  

  const handleDelete = async () => {
    if (!confirm('退会しますか？')) return;

    const userIdData = localStorage.getItem('userId');
    if (!userIdData) {
      alert('ログインしてください。');
      router.push('/login');
      return;
    }

    try {
      const parsedUserId = JSON.parse(userIdData);

      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parsedUserId.value,
          currentPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('退会完了');
        localStorage.clear();
        router.push('/');
      } else {
        alert(data.message || '退会失敗');
      }
    } catch (error) {
      console.error('エラー:', error);
      alert('エラー');
    }
  };

  // make.tsx 스타일 기반 스타일 객체 정의 (반응형 포함)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const pageBgStyle: React.CSSProperties = {
    background: 'linear-gradient(120deg, #f8fafc 0%, #e6f7ff 100%)',
    minHeight: '100vh',
    padding: isMobile ? '16px 0' : '40px 0',
  };
  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: isMobile ? 12 : 18,
    boxShadow: '0 4px 24px #b3e5fc44',
    maxWidth: isMobile ? '98vw' : 600,
    margin: '0 auto',
    padding: isMobile ? '18px 6vw 18px 6vw' : '36px 20px 28px 20px',
    position: 'relative',
    border: '1.5px solid #e0f7fa',
  };
  const fieldWrap: React.CSSProperties = { marginBottom: 16 };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: isMobile ? '10px 10px' : '12px 14px',
    fontSize: isMobile ? 15 : 17,
    background: '#f7fafd',
    color: '#222',
    border: '1.5px solid #b2ebf2',
    borderRadius: 10,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    boxShadow: '0 1px 4px #b2ebf222',
    marginBottom: 0,
  };
  const updateButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 0',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: isMobile ? '1rem' : '1.1rem',
    fontWeight: 700,
    marginTop: 8,
  };
  const deleteButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 0',
    backgroundColor: '#d94350',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: isMobile ? '1rem' : '1.1rem',
    fontWeight: 700,
    marginTop: 8,
  };
  const emailInputStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: '#f0f0f0',
    color: '#999',
    border: '1.5px solid #b2ebf2',
  };

  return (
    <>
      <Header />
      <div style={pageBgStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginBottom: isMobile ? 18 : 28, fontWeight: 700, fontSize: isMobile ? 22 : 28, letterSpacing: -1, color: '#4caf50', textAlign: 'center', fontFamily: 'inherit' }}>情報編集</h1>
          <div style={fieldWrap}>
            <label>メールアドレス</label>
            <input value={email} readOnly style={emailInputStyle} />
          </div>
          <div style={fieldWrap}>
            <label>ニックネーム</label>
            <input value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label>パスワード</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ margin: '20px 0' }}>
            <label>
              <input type="checkbox" checked={changePassword} onChange={e => setChangePassword(e.target.checked)} /> パスワード変更
            </label>
          </div>
          {changePassword && (
            <>
              <div style={fieldWrap}>
                <label>新しいパスワード</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
              </div>
              <div style={fieldWrap}>
                <label>新しいパスワード確認</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 30 }}>
            <button onClick={handleUpdate} style={updateButtonStyle}>変更する</button>
            <button onClick={handleDelete} style={deleteButtonStyle}>退会する</button>
          </div>
        </div>
      </div>
    </>
  );
}

