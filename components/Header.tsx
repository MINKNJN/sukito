// components/Header.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getStorageWithExpire } from '@/lib/utils';
import AlertModal from '@/components/AlertModal';



export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const showAlertModal = (msg: string) => {
    setAlertMessage(msg);
    setShowAlert(true);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkSession = () => {
      const userId = getStorageWithExpire('userId');
      const nickname = getStorageWithExpire('nickname');
      const token = localStorage.getItem('token'); 
  
      if (userId && nickname && token) {
        setIsLoggedIn(true);
        setNickname(nickname);
      } else {
        setIsLoggedIn(false);
        setNickname('');
        localStorage.clear(); 
      }
    };
  
    checkSession(); 
  
    const interval = setInterval(checkSession, 5 * 60 * 1000); 
    return () => clearInterval(interval);
  }, []);
  

  const handleLogout = () => {
    localStorage.clear();
    router.reload();
  };

  const handleMakeClick = () => {
    const userId = getStorageWithExpire('userId');
    if (!userId) {
      router.push('/login');
    } else {
      router.push('/make');
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const isMobile = windowWidth <= 768;

  return (
    <header style={headerStyle}>
      
      {showAlert && (
        <AlertModal
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={logoStyle}>
          🏆 スキト
        </Link>
      </div>

      <nav style={{
        display: isMobile ? (menuOpen ? 'flex' : 'none') : 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: 20,
        background: isMobile ? '#f8f9fa' : 'transparent',
        position: isMobile ? 'absolute' : 'static',
        top: isMobile ? 60 : undefined,
        left: 0,
        width: isMobile ? '100%' : 'auto',
        padding: isMobile ? '10px 0' : 0,
        zIndex: 1000,
      }}>
        <Link href="/" style={linkStyle}>好きトーナメント</Link>
        <button onClick={handleMakeClick} style={buttonLinkStyle}>トーナメン作る</button>
        {isLoggedIn && (
          <>
            <Link href="/mygames" style={linkStyle}>マイトーナメント</Link>
          </>
        )}
        {isLoggedIn ? (
          <>
            <Link href="/profile" style={linkStyle}>情報編集</Link>
            <button onClick={handleLogout} style={buttonLinkStyle}>ログアウト</button>
          </>
        ) : (
          <Link href="/login" style={linkStyle}>ログイン</Link>
        )}
      </nav>

      {isMobile && (
        <button onClick={toggleMenu} style={hamburgerButtonStyle}>
          ☰
        </button>
      )}
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 20px',
  borderBottom: '1px solid #ccc',
  background: '#f8f9fa',
  height: '60px',
  position: 'relative',
  width: '100%',
};

const logoStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: 22,
  textDecoration: 'none',
  color: '#333',
};

const linkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#333',
  fontSize: '0.95rem',
};

const buttonLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#333',
  cursor: 'pointer',
  fontSize: '0.95rem',
};

const hamburgerButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 24,
  cursor: 'pointer',
};
