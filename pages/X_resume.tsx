// pages/resume.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';

interface ResumeGame {
  _id: string;
  userId: string;
  gameId: string;
  gameTitle: string;
  gameDesc: string;
  resumeData: any;
  updatedAt: string;
}

export default function ResumePage() {
  const router = useRouter();
  const [games, setGames] = useState<ResumeGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    const fetchResumeGames = async () => {
      try {
        const res = await fetch(`/api/resume?action=list&userId=${userId}`);
        const data = await res.json();
        setGames(data.games || []);
      } catch (err) {
        console.error('이어하기 목록 불러오기 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResumeGames();
  }, [router]);

  const handleResume = (game: ResumeGame) => {
    if (!game.resumeData) {
      alert('이어할 데이터가 없습니다.');
      return;
    }

    const original = game.resumeData;

    const formatted = {
      gameId: game.gameId,
      round: original.round || original.currentRound || original.selectedRound || 4,
      items: original.items || original.remainingItems || [],
      advancing: original.advancing || original.winnerHistory || [],
      matchIndex: original.matchIndex ?? 0,
    };

    // 저장
    localStorage.setItem('sukito_game', JSON.stringify(formatted));
    // 이동
    router.push(`/play/${game.gameId}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('저장된 이어하기를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/resume?action=delete&userId=${localStorage.getItem('userId')}&gameId=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('삭제 완료!');
        setGames(prev => prev.filter(g => g._id !== id));
      } else {
        alert('삭제 실패');
      }
    } catch (err) {
      console.error('이어하기 삭제 오류:', err);
      alert('네트워크 오류');
    }
  };

  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;

  return (
    <>
      <Header />
      <div style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 20 }}>이어하기</h1>

        {games.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {games.map((game) => (
              <div key={game._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, backgroundColor: '#fff' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{game.gameTitle}</h3>
                <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: 12 }}>{game.gameDesc}</p>
                <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: 12 }}>
                  저장일시: {new Date(game.updatedAt).toLocaleString()}
                </p>
                <button onClick={() => handleResume(game)} style={resumeButtonStyle}>이어하기</button>
                <button onClick={() => handleDelete(game._id)} style={deleteButtonStyle}>삭제</button>
              </div>
            ))}
          </div>
        ) : (
          <p>저장된 이어하기가 없습니다.</p>
        )}
      </div>
    </>
  );
}

const resumeButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 0',
  marginBottom: 8,
  borderRadius: 6,
  backgroundColor: '#00c471',
  color: 'white',
  border: 'none',
  fontSize: '1rem',
  cursor: 'pointer',
};

const deleteButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  borderRadius: 6,
  backgroundColor: '#d94350',
  color: 'white',
  border: 'none',
  fontSize: '0.9rem',
  cursor: 'pointer',
};
