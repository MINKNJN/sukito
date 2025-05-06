// pages/admin/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';

interface User {
  _id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
}

interface GameItem {
  name: string;
  url: string;
  type: 'image' | 'gif' | 'video' | 'youtube';
}

interface Game {
  _id: string;
  title: string;
  desc: string;
  itemsCount: number;
}

interface Comment {
  _id: string;
  gameId: string;
  userId: string;
  content: string;
  createdAt: string;
  reportCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'users' | 'games' | 'comments'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRoleData = localStorage.getItem('role');
    if (!userRoleData) {
      alert('ログインしてください。');
      router.push('/login');
      return;
    }
    const role = JSON.parse(userRoleData).value;
    if (role !== 'admin') {
      alert('管理者のみアクセスできます。');
      router.push('/');
      return;
    }
    fetchUsers();
    fetchGames();
    fetchComments();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('회원 목록 요청 실패');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('エラー:', err);
      alert('회원 목록 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/admin/games');
      if (!res.ok) throw new Error('게임 목록 요청 실패');
      const data = await res.json();
      setGames(data.games || []);
    } catch (err) {
      console.error('エラー:', err);
      alert('게임 목록 불러오기 실패');
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/admin/comments');
      if (!res.ok) throw new Error('댓글 목록 요청 실패');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('エラー:', err);
      alert('댓글 목록 불러오기 실패');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('정말 이 회원을 삭제할까요?')) return;
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      });
      if (res.ok) {
        alert('삭제 완료');
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || '삭제 실패');
      }
    } catch (err) {
      console.error('エラー:', err);
      alert('서버 오류');
    }
  };

  const handleToggleRole = async (id: string, currentRole: 'user' | 'admin') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`이 회원을 ${newRole}로 변경할까요?`)) return;
    try {
      const res = await fetch('/api/admin/updateRole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, newRole }),
      });
      if (res.ok) {
        alert('권한 변경 완료');
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || '변경 실패');
      }
    } catch (err) {
      console.error('エラー:', err);
      alert('서버 오류');
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm('정말 이 게임을 삭제할까요?')) return;
    try {
      const res = await fetch('/api/admin/deleteGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: id }),
      });
      if (res.ok) {
        alert('게임 삭제 완료');
        fetchGames();
      } else {
        const data = await res.json();
        alert(data.message || '게임 삭제 실패');
      }
    } catch (err) {
      console.error('エラー:', err);
      alert('서버 오류');
    }
  };

  const handleEditGame = (game: Game) => {
    if (!game._id) {
      alert('잘못된 게임 정보입니다.');
      return;
    }
    if (!confirm('이 게임을 수정하시겠습니까?')) return;
    router.push(`/make?id=${game._id}`);
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('정말 이 댓글을 삭제할까요?')) return;
    try {
      const res = await fetch('/api/admin/deleteComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: id }),
      });
      if (res.ok) {
        alert('댓글 삭제 완료');
        fetchComments();
      } else {
        const data = await res.json();
        alert(data.message || '댓글 삭제 실패');
      }
    } catch (err) {
      console.error('댓글 삭제 오류:', err);
      alert('서버 오류');
    }
  };

  const handleEditComment = async (comment: Comment) => {
    const newContent = prompt('새로운 댓글 내용을 입력하세요.', comment.content);
    if (newContent === null) return; // 취소하면 종료
  
    const newReportCountInput = prompt('새로운 신고 수를 입력하세요.', String(comment.reportCount || 0));
    if (newReportCountInput === null) return;
    const newReportCount = parseInt(newReportCountInput, 10);
    if (isNaN(newReportCount)) {
      alert('올바른 숫자를 입력하세요.');
      return;
    }
  
    try {
      const res = await fetch('/api/admin/updateComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment._id, newContent, newReportCount }),
      });
      if (res.ok) {
        alert('댓글 수정 완료');
        fetchComments();
      } else {
        const data = await res.json();
        alert(data.message || '댓글 수정 실패');
      }
    } catch (err) {
      console.error('댓글 수정 오류:', err);
      alert('서버 오류');
    }
  };
  

  if (loading) return <div style={{ padding: 40 }}>ローディング中...</div>;

  return (
    <>
      <Header />
      <div style={{ padding: 24 }}>
        <h1>관리자 페이지</h1>
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setTab('users')} style={{ marginRight: 10 }}>
            회원 관리
          </button>
          <button onClick={() => setTab('games')} style={{ marginRight: 10 }}>
            게임 관리
          </button>
          <button onClick={() => setTab('comments')}>
            댓글 관리
          </button>
        </div>

        {tab === 'users' && (
          <>
            <h2 style={{ marginBottom: 20 }}>회원 목록</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>이메일</th>
                  <th style={thStyle}>닉네임</th>
                  <th style={thStyle}>권한</th>
                  <th style={thStyle}>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.nickname}</td>
                    <td style={tdStyle}>{user.role}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleToggleRole(user._id, user.role)} style={user.role === 'admin' ? downgradeButtonStyle : upgradeButtonStyle}>
                        {user.role === 'admin' ? '일반회원으로' : '관리자로'}
                      </button>
                      <button onClick={() => handleDeleteUser(user._id)} style={deleteButtonStyle}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'games' && (
          <>
            <h2 style={{ marginBottom: 20 }}>게임 목록</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>제목</th>
                  <th style={thStyle}>설명</th>
                  <th style={thStyle}>아이템 수</th>
                  <th style={thStyle}>관리</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game._id}>
                    <td style={tdStyle}>{game.title}</td>
                    <td style={tdStyle}>{game.desc}</td>
                    <td style={tdStyle}>{game.itemsCount}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleEditGame(game)} style={upgradeButtonStyle}>
                        수정하기
                      </button>
                      <button onClick={() => handleDeleteGame(game._id)} style={deleteButtonStyle}>
                        삭제하기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'comments' && (
          <>
            <h2 style={{ marginBottom: 20 }}>댓글 목록</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                <th style={thStyle}>게임명</th>
                  <th style={thStyle}>댓글 내용</th>
                  <th style={thStyle}>작성일</th>
                  <th style={thStyle}>신고 수</th>
                  <th style={thStyle}>관리</th>
                </tr>
              </thead>
              <tbody>
  {comments.map((comment) => {
    const relatedGame = games.find(game => game._id === comment.gameId);
    return (
      <tr
        key={comment._id}
        style={comment.reportCount >= 3 ? { backgroundColor: '#ffe6e6' } : {}}
      >
        <td style={tdStyle}>
          {relatedGame ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{relatedGame.title}</span>
            </div>
          ) : (
            <span style={{ color: 'gray' }}>삭제된 게임</span>
          )}
        </td>
        <td style={tdStyle}>
          {comment.content}
          {comment.reportCount >= 3 && (
            <span style={{ color: 'red', fontWeight: 'bold', marginLeft: 8 }}>
              ⚠️ 신고 누적
            </span>
          )}
        </td>
        <td style={tdStyle}>{new Date(comment.createdAt).toLocaleString()}</td>
        <td style={tdStyle}>{comment.reportCount}</td>
        <td style={tdStyle}>
          <button onClick={() => handleEditComment(comment)} style={upgradeButtonStyle}>
            수정
          </button>
          <button onClick={() => handleDeleteComment(comment._id)} style={deleteButtonStyle}>
            삭제
          </button>
        </td>
      </tr>
    );
  })}
</tbody>

            </table>
          </>
        )}
      </div>
    </>
  );
}

const thStyle: React.CSSProperties = { border: '1px solid #ccc', padding: 8, backgroundColor: '#f2f2f2' };
const tdStyle: React.CSSProperties = { border: '1px solid #ccc', padding: 8, textAlign: 'center' };
const upgradeButtonStyle: React.CSSProperties = { padding: '6px 10px', marginRight: 8, backgroundColor: '#00c471', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' };
const downgradeButtonStyle: React.CSSProperties = { padding: '6px 10px', marginRight: 8, backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' };
const deleteButtonStyle: React.CSSProperties = { padding: '6px 10px', backgroundColor: '#d94350', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' };
