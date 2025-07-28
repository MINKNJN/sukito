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
  type: 'image' | 'gif' | 'youtube';
};

type Game = {
  _id: string;
  title: string;
  desc: string;
  createdAt: string;
  createdBy: string;
  thumbnails?: GameItem[];
  playCount?: number;
  commentCount?: number;
};

export default function MyGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showAlert, showConfirm } = useAlert();
  const [stats, setStats] = useState({ totalGames: 0, totalPlays: 0, totalComments: 0 });

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
      // 내 게임만 가져오기 + playCount, commentCount 포함
      const res = await fetch('/api/games');
      const data = await res.json();
      const myGames = data.filter((game: Game) => game.createdBy?.toString?.() === userId);
      // 各ゲーム別コメント数集計
      const commentCounts = await Promise.all(myGames.map(async (game: Game) => {
        const res = await fetch(`/api/comments?id=${game._id}`);
        const data = await res.json();
        return (data?.comments?.length ?? 0);
      }));
      const gamesWithCounts = myGames.map((game: Game, i: number) => ({ ...game, commentCount: commentCounts[i] }));
      setGames(gamesWithCounts);
      // 통계 계산
      setStats({
        totalGames: gamesWithCounts.length,
        totalPlays: gamesWithCounts.reduce((sum: number, g: Game) => sum + (g.playCount ?? 0), 0),
        totalComments: commentCounts.reduce((sum: number, c: number) => sum + c, 0),
      });
    } catch (error) {
      console.error('エラー:', error);
    }
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
  
  // 스타일
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
  const statBoxStyle: React.CSSProperties = {
    display: 'flex',
    gap: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    background: '#e0f7fa',
    borderRadius: 12,
    padding: '18px 0',
    fontWeight: 700,
    fontSize: isMobile ? 15 : 18,
    color: '#00796b',
  };
  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 80,
  };
  const statNumStyle: React.CSSProperties = {
    fontSize: isMobile ? 20 : 28,
    fontWeight: 900,
    color: '#009688',
    marginBottom: 2,
  };
  const gameListStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  };
  const myCardStyle: React.CSSProperties = {
    flex: '1 1 320px',
    minWidth: 280,
    maxWidth: 400,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px #b2ebf222',
    border: '1.5px solid #e0f7fa',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', 
    height: 260,
    overflow: 'hidden',
  };
  const thumbRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    width: '90%',
    height: '45%',
    marginBottom: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  };
  const titleRowStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: isMobile ? 14 : 18,
    color: '#4caf50',
    margin: '12px 0 0 0',
    padding: 0,
    lineHeight: 1.2,
  };
  const badgeRowStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    margin: '12px 0 0 0',
  };
  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    margin: '12px 0 0 0',
    width: '90%',
  };
  const buttonStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: '8px 0',
    fontSize: '1rem',
    borderRadius: 8,
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    margin: 0,
    background: '#e0f7fa',
    color: '#00796b',
    transition: 'background 0.2s',
  };
  const editButtonStyle: React.CSSProperties = {
    background: '#fffde7',
    color: '#fbc02d',
    border: '1.5px solid #fbc02d',
  };
  const deleteButtonStyle: React.CSSProperties = {
    background: '#ffebee',
    color: '#d32f2f',
    border: '1.5px solid #d32f2f',
  };
  const resultButtonStyle: React.CSSProperties = {
    background: '#e3f2fd',
    color: '#1976d2',
    border: '1.5px solid #1976d2',
  };
  const playButtonStyle: React.CSSProperties = {
    background: '#e8f5e9',
    color: '#43a047',
    border: '1.5px solid #43a047',
  };
  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    background: '#e0f2f1',
    color: '#00796b',
    borderRadius: 8,
    padding: '2px 10px',
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
  };

  return (
    <>
      <UploadModal visible={isDeleting} message="少々お待ちください。" />
      <Header />
      <div style={pageBgStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginBottom: 20, fontWeight: 900, fontSize: isMobile ? 22 : 32, letterSpacing: -1, color: '#4caf50', textAlign: 'center' }}>マイトーナメント</h1>
          <div style={statBoxStyle}>
            <div style={statItemStyle}><span style={statNumStyle}>{stats.totalGames}</span>ゲーム</div>
            <div style={statItemStyle}><span style={statNumStyle}>{stats.totalPlays}</span>プレイ</div>
            <div style={statItemStyle}><span style={statNumStyle}>{stats.totalComments}</span>コメント</div>
          </div>
          <div style={gameListStyle}>
            {games.map((game) => (
              <div key={game._id} style={myCardStyle}>
                {/* 썸네일 2개 크게 */}
                <div style={thumbRowStyle}>
                  {(game.thumbnails && game.thumbnails.length > 0 ? game.thumbnails.slice(0, 2) : [null, null]).map((item, idx) => (
                    item ? (
                      item.type === 'image' ? (
                        <img
                          key={item.url}
                          src={item.url}
                          alt={item.name}
                          style={{ width: '50%', height: '100%', objectFit: 'cover', borderRadius: 8, background: '#eee', border: '1px solid #e0f7fa' }}
                        />
                      ) : item.type === 'gif' ? (
                        <video
                          key={item.url}
                          src={item.url}
                          style={{ width: '50%', height: '100%', objectFit: 'cover', borderRadius: 8, background: '#eee', border: '1px solid #e0f7fa' }}
                          muted
                          autoPlay
                          loop
                          playsInline
                        />
                      ) : item.type === 'youtube' ? (
                        <img
                          key={item.url}
                          src={`https://img.youtube.com/vi/${(item.url.match(/embed\/([a-zA-Z0-9_-]{11})/) || [])[1] || ''}/mqdefault.jpg`}
                          alt={item.name}
                          style={{ width: '50%', height: '100%', objectFit: 'cover', borderRadius: 8, background: '#eee', border: '1px solid #e0f7fa' }}
                        />
                      ) : null
                    ) : (
                      <div
                        key={idx}
                        style={{ width: '50%', height: '100%', borderRadius: 8, background: '#f0f0f0', border: '1px solid #e0f7fa' }}
                      />
                    )
                  ))}
                </div>
                {/* 타이틀, 뱃지 중앙 정렬 */}
                <div style={titleRowStyle}>{game.title}</div>
                <div style={badgeRowStyle}>
                  <span style={badgeStyle}>プレイ {game.playCount ?? 0}</span>
                  <span style={badgeStyle}>コメント {game.commentCount ?? 0}</span>
                </div>
                <div style={buttonGroupStyle}>
                  <button style={{ ...buttonStyle, ...playButtonStyle }} onClick={() => location.href = `/play/${game._id}`}>プレイ</button>
                  <button style={{ ...buttonStyle, ...editButtonStyle }} onClick={() => location.href = `/make?id=${game._id}`}>編集</button>
                  <button style={{ ...buttonStyle, ...deleteButtonStyle }} onClick={() => handleDelete(game._id)}>削除</button>
                  <button style={{ ...buttonStyle, ...resultButtonStyle }} onClick={() => location.href = `/result?id=${game._id}`}>結果</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

