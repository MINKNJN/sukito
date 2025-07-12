// /page/mygames.tsx
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { getStorageWithExpire } from '@/lib/utils';
import UploadModal from '@/components/UploadModal';
import GoogleAd from '@/components/GoogleAd';
import { useAlert } from '@/lib/alert';

type GameItem = {
  name: string;
  url: string;
  type: 'image' | 'gif' | 'video' | 'youtube';
};

type Game = {
  _id: string;
  title: string;
  desc: string;
  createdAt: string;
  createdBy: string;
  thumbnails?: GameItem[];
};

export default function MyGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [sortOption, setSortOption] = useState<'popular' | 'latest'>('popular');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'week' | 'day'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('ログインしてください。', 'error');
        location.href = '/login';
        return;
      }
  
      const meRes = await fetch('/api/jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      const meData = await meRes.json();
      if (!meRes.ok || !meData.userId) {
        showAlert('ログインしてください。', 'error');
        localStorage.clear();
        location.href = '/login';
        return;
      }
  
      const userId = meData.userId;

      const res = await fetch('/api/games');
      const data = await res.json();

      

  
      const myGames = data.filter((game: Game) => {
        return game.createdBy?.toString?.() === userId;
      });

      setGames(myGames);
    } catch (error) {
      console.error('エラー:', error);
    }
  };

  const handleSearch = () => {
    setSearchKeyword(searchInput);
    setVisibleCount(10);
  };

  const handleDelete = async (id: string) => {
    showConfirm('ゲームを削除してもよろしいですか？', () => {
      setIsDeleting(true);
      
      fetch(`/api/games?id=${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            showAlert('削除完了!', 'success');
            fetchGames();
          } else {
            showAlert('削除失敗', 'error');
          }
        })
        .catch(err => {
          console.error('エラー:', err);
          showAlert('ネットワークエラー', 'error');
        })
        .finally(() => {
          setIsDeleting(false);
        });
    });
  };
  
  const isWithinRange = (createdAt: string, range: 'month' | 'week' | 'day') => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = now.getTime() - created.getTime();
    if (range === 'month') return diff <= 30 * 24 * 60 * 60 * 1000;
    if (range === 'week') return diff <= 7 * 24 * 60 * 60 * 1000;
    if (range === 'day') return diff <= 24 * 60 * 60 * 1000;
    return true;
  };

  const filteredGames = games
    .filter((game) => {
      if (dateRange !== 'all' && !isWithinRange(game.createdAt, dateRange)) return false;
      if (searchKeyword && !(
        game.title.includes(searchKeyword) ||
        game.desc.includes(searchKeyword) 
      )) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'popular') return (b.thumbnails?.length ?? 0) - (a.thumbnails?.length ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // make.tsx/profile.tsx 스타일 기반 스타일 객체 정의 (반응형 포함)
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
    maxWidth: isMobile ? '98vw' : 1100,
    margin: '0 auto',
    padding: isMobile ? '18px 6vw 18px 6vw' : '36px 20px 28px 20px',
    position: 'relative',
    border: '1.5px solid #e0f7fa',
  };
  const buttonStyle: React.CSSProperties = {
    background: '#f7fafd',
    border: '1.5px solid #b2ebf2',
    padding: isMobile ? '8px 10px' : '8px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: isMobile ? '0.95rem' : '1rem',
    color: '#4caf50',
    fontWeight: 600,
    boxShadow: '0 1px 4px #b2ebf222',
    transition: 'all 0.2s',
  };
  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#4caf50',
    color: '#fff',
    borderColor: '#4caf50',
    boxShadow: '0 2px 8px #4caf5022',
  };
  const inputStyle: React.CSSProperties = {
    padding: isMobile ? '8px 10px' : '8px 14px',
    border: '1.5px solid #b2ebf2',
    borderRadius: 8,
    fontSize: isMobile ? '0.95rem' : '1rem',
    background: '#f7fafd',
    color: '#222',
    outline: 'none',
    minWidth: 120,
  };
  const moreButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: isMobile ? '12px 0' : '14px 0',
    fontSize: isMobile ? '1rem' : '1.1rem',
    borderRadius: 10,
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px #4caf5022',
    marginTop: 0,
  };
  const adCardStyle: React.CSSProperties = {
    height: 100,
    border: '2px dashed #b2ebf2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    background: '#f7fafd',
    margin: isMobile ? '16px 0' : '20px 0',
  };

  return (
    <>
      <UploadModal visible={isDeleting} message="少々お待ちください。" />
      <Header />
      <div style={pageBgStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginBottom: 20, fontWeight: 900, fontSize: isMobile ? 22 : 32, letterSpacing: -1, color: '#4caf50', textAlign: 'center' }}>マイトーナメント</h1>
          <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setSortOption('popular'); setVisibleCount(10); }} style={sortOption === 'popular' ? activeButtonStyle : buttonStyle}>人気順</button>
              <button onClick={() => { setSortOption('latest'); setVisibleCount(10); }} style={sortOption === 'latest' ? activeButtonStyle : buttonStyle}>新着順</button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setDateRange('all'); setVisibleCount(10); }} style={dateRange === 'all' ? activeButtonStyle : buttonStyle}>すべて</button>
              <button onClick={() => { setDateRange('month'); setVisibleCount(10); }} style={dateRange === 'month' ? activeButtonStyle : buttonStyle}>月</button>
              <button onClick={() => { setDateRange('week'); setVisibleCount(10); }} style={dateRange === 'week' ? activeButtonStyle : buttonStyle}>週</button>
              <button onClick={() => { setDateRange('day'); setVisibleCount(10); }} style={dateRange === 'day' ? activeButtonStyle : buttonStyle}>日</button>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <input type="text" placeholder="ゲーム" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={inputStyle} />
              <button onClick={handleSearch} style={buttonStyle}>検索</button>
            </div>
          </div>
          <div className="row equal">
            {filteredGames.slice(0, visibleCount).map((game, index) => {
              if (index % 10 === 7) {
                return (
                  <>
                    <div key={game._id} className="col-6 col-md-3 col-xl-2" style={{ padding: '2px' }}>
                      <GameCard
                        id={game._id}
                        title={game.title}
                        desc={game.desc}
                        thumbnailItems={game.thumbnails}
                        adminButtons={
                          <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                            <button onClick={() => location.href = `/make?id=${game._id}`} style={{ flex: 1, backgroundColor: '#ddeeff', border: '1px solid #42a5f5', color: '#1565c0', borderRadius: 4, fontSize: '0.8rem', padding: '2px' }}>編集する</button>
                            <button onClick={() => handleDelete(game._id)} style={{ flex: 1, backgroundColor: '#ffdddd', border: '1px solid #ff4d4d', color: '#cc0000', borderRadius: 4, fontSize: '0.8rem', padding: '2px' }}>削除する</button>
                          </div>
                        }
                      />
                    </div>

                    <div className="col-12 col-md-6 col-xl-4" style={{ padding: '2px' }}>
                      <div style={{ height: '95%', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GoogleAd />
                      </div>
                    </div>
                  </>
                );
              }
              return (
                <div key={game._id} className="col-6 col-md-3 col-xl-2" style={{ padding: '2px' }}>
                  <GameCard
                    id={game._id}
                    title={game.title}
                    desc={game.desc}
                    thumbnailItems={game.thumbnails}
                    adminButtons={
                      <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                        <button onClick={() => location.href = `/make?id=${game._id}`} style={{ flex: 1, backgroundColor: '#ddeeff', border: '1px solid #42a5f5', color: '#1565c0', borderRadius: 4, fontSize: '0.8rem', padding: '2px' }}>編集する</button>
                        <button onClick={() => handleDelete(game._id)} style={{ flex: 1, backgroundColor: '#ffdddd', border: '1px solid #ff4d4d', color: '#cc0000', borderRadius: 4, fontSize: '0.8rem', padding: '2px' }}>削除する</button>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>

          {visibleCount < filteredGames.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              style={moreButtonStyle}
            >
              もっと見る
            </button>
          )}
        </div>
      </div>
    </>
  );
}

