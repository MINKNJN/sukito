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

  return (
    <>
      <Header />
      <div style={{ padding: 24, maxWidth: 600, margin: 'auto' }}>
        <h1 style={{ marginBottom: 20 }}>情報編集</h1>

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
    </>
  );
}

const fieldWrap: React.CSSProperties = { marginBottom: 16 };
const inputStyle: React.CSSProperties = { width: '100%', padding: 8, fontSize: '1rem' };
const updateButtonStyle: React.CSSProperties = { flex: 1, padding: '10px 0', backgroundColor: '#00c471', color: 'white', border: 'none', borderRadius: 6, fontSize: '1rem' };
const deleteButtonStyle: React.CSSProperties = { flex: 1, padding: '10px 0', backgroundColor: '#d94350', color: 'white', border: 'none', borderRadius: 6, fontSize: '1rem' };
const emailInputStyle: React.CSSProperties = { 
  width: '100%', 
  padding: 8, 
  fontSize: '1rem',
  backgroundColor: '#f0f0f0',   
  color: '#999',                
};

