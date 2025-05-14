// /page/mygames.tsx
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { getStorageWithExpire } from '@/lib/utils';
import UploadModal from '@/components/UploadModal';


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
  items: GameItem[];
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


  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('ログインしてください。');
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
        alert('ログインしてください。');
        localStorage.clear();
        location.href = '/login';
        return;
      }
  
      const userId = meData.userId;

      const res = await fetch('/api/games');
      const data = await res.json();
  
      const myGames = data.filter((game: Game) => game.createdBy === userId);
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
    const confirmDelete = confirm('ゲームを削除してもよろしいですか？');
    if (!confirmDelete) return;
    setIsDeleting(true);
  
    try {
      const res = await fetch(`/api/games?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('削除完了!');
        fetchGames();
      } else {
        alert('削除失敗');
      }
    } catch (err) {
      console.error('エラー:', err);
      alert('ネットワークエラー');
    } finally {
      setIsDeleting(false);
    }
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
        game.desc.includes(searchKeyword) ||
        game.items.some((item) => item.name.includes(searchKeyword))
      )) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'popular') return b.items.length - a.items.length;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <>
    <UploadModal visible={isDeleting} message="少々お待ちください。" />
      <Header />

      <div style={{ width: '100%', height: 100, border: '2px dashed #ccc', margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        好きトーナメント
      </div>

      <div style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 20 }}>マイトーナメント</h1>

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
            <input type="text" placeholder="ゲーム" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }} />
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
                      items={game.items}
                      thumbnailItems={game.thumbnails}
                      adminButtons={
                        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                          <button onClick={() => location.href = `/make?id=${game._id}`} style={{ flex: 1, backgroundColor: '#ddeeff', border: '1px solid #42a5f5', color: '#1565c0', borderRadius: 4, fontSize: '0.8rem', padding: '4px 0' }}>編集する</button>
                          <button onClick={() => handleDelete(game._id)} style={{ flex: 1, backgroundColor: '#ffdddd', border: '1px solid #ff4d4d', color: '#cc0000', borderRadius: 4, fontSize: '0.8rem', padding: '4px 0' }}>削除する</button>
                        </div>
                      }
                    />
                  </div>

                  <div className="col-12 col-md-6 col-xl-4" style={{ padding: '2px' }}>
                    <div style={{ height: '95%', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      好きトーナメント
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
                  items={game.items}
                  thumbnailItems={game.thumbnails}
                  adminButtons={
                    <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                      <button onClick={() => location.href = `/make?id=${game._id}`} style={{ flex: 1, backgroundColor: '#ddeeff', border: '1px solid #42a5f5', color: '#1565c0', borderRadius: 4, fontSize: '0.8rem', padding: '4px 0' }}>編集する</button>
                      <button onClick={() => handleDelete(game._id)} style={{ flex: 1, backgroundColor: '#ffdddd', border: '1px solid #ff4d4d', color: '#cc0000', borderRadius: 4, fontSize: '0.8rem', padding: '4px 0' }}>削除する</button>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>

        {visibleCount < filteredGames.length && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              style={{
                width: '100%',
                padding: '12px 0',
                fontSize: '1.1rem',
                borderRadius: 6,
                backgroundColor: '#4caf50',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              もっと見る
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const buttonStyle: React.CSSProperties = {
  background: '#f8f8f8',
  border: '1px solid #ccc',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#4caf50',
  color: '#fff',
  borderColor: '#4caf50',
};
