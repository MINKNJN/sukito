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
  // 페이지네이션 상태 추가
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [gamePage, setGamePage] = useState(1);
  const [gameTotal, setGameTotal] = useState(0);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotal, setCommentTotal] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const PAGE_LIMIT = 20;

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
    fetchUsers(userPage);
    fetchGames(gamePage);
    fetchComments(commentPage);
    // eslint-disable-next-line
  }, [router]);

  // 탭 변경 시 페이지 초기화
  useEffect(() => {
    if (tab === 'users') setUserPage(1);
    if (tab === 'games') setGamePage(1);
    if (tab === 'comments') setCommentPage(1);
  }, [tab]);

  // 페이지 변경 시 데이터 새로 불러오기
  useEffect(() => { if (tab === 'users') fetchUsers(userPage); }, [userPage]);
  useEffect(() => { if (tab === 'games') fetchGames(gamePage); }, [gamePage]);
  useEffect(() => { if (tab === 'comments') fetchComments(commentPage); }, [commentPage]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {} as Record<string, string>;
  };

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=${PAGE_LIMIT}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('회원 목록 요청 실패');
      const data = await res.json();
      setUsers(data.users || []);
      setUserTotal(data.total || 0);
    } catch (err) {
      console.error('エラー:', err);
      alert('회원 목록 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async (page = 1) => {
    try {
      const res = await fetch(`/api/admin/games?page=${page}&limit=${PAGE_LIMIT}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('게임 목록 요청 실패');
      const data = await res.json();
      setGames(data.games || []);
      setGameTotal(data.total || 0);
    } catch (err) {
      console.error('エラー:', err);
      alert('게임 목록 불러오기 실패');
    }
  };

  const fetchComments = async (page = 1) => {
    try {
      const res = await fetch(`/api/admin/comments?page=${page}&limit=${PAGE_LIMIT}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('댓글 목록 요청 실패');
      const data = await res.json();
      setComments(data.comments || []);
      setCommentTotal(data.total || 0);
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

  const badgeStyle = (role: 'user' | 'admin') => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 16,
    fontWeight: 700,
    fontSize: 14,
    color: role === 'admin' ? '#fff' : '#333',
    background: role === 'admin' ? 'linear-gradient(90deg,#ff9800,#d94350)' : '#e0e0e0',
    boxShadow: role === 'admin' ? '0 2px 8px #ff980055' : 'none',
    border: role === 'admin' ? '2px solid #d94350' : '1px solid #ccc',
    transition: 'all 0.2s',
  });

  const tabButtonStyle = (active: boolean) => ({
    marginRight: 10,
    padding: '8px 20px',
    fontWeight: 700,
    fontSize: 16,
    borderRadius: 8,
    border: active ? '2px solid #00c471' : '1px solid #ccc',
    background: active ? '#e6fff3' : '#fff',
    color: active ? '#00c471' : '#333',
    boxShadow: active ? '0 2px 8px #00c47122' : 'none',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
  });

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 24px #0001',
    padding: 32,
    margin: '0 auto',
    maxWidth: 1100,
  };

  return (
    <>
      <Header />
      <div style={{ background: '#f7f8fa', minHeight: '100vh', padding: '40px 0' }}>
        <div style={cardStyle}>
          <h1 style={{ fontWeight: 900, fontSize: 32, marginBottom: 32, letterSpacing: -1 }}>관리자 페이지</h1>
          <div style={{ marginBottom: 32, display: 'flex', gap: 12 }}>
            <button onClick={() => setTab('users')} style={tabButtonStyle(tab === 'users')}>회원 관리</button>
            <button onClick={() => setTab('games')} style={tabButtonStyle(tab === 'games')}>게임 관리</button>
            <button onClick={() => setTab('comments')} style={tabButtonStyle(tab === 'comments')}>댓글 관리</button>
          </div>

          {tab === 'users' && (
            <>
              <h2 style={{ marginBottom: 24, fontWeight: 800, fontSize: 24 }}>회원 목록</h2>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px #0001' }}>
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
                    <tr key={user._id} style={{ background: user.role === 'admin' ? '#fffbe6' : '#fff' }}>
                      <td style={tdStyle}>{user.email}</td>
                      <td style={tdStyle}>{user.nickname}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(user.role)}>
                          {user.role === 'admin' ? '관리자' : '일반회원'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleToggleRole(user._id, user.role)}
                          style={{
                            ...user.role === 'admin' ? downgradeButtonStyle : upgradeButtonStyle,
                            fontWeight: 700,
                            opacity: user.role === 'admin' ? 1 : 0.9,
                            border: user.role === 'admin' ? '2px solid #ff9800' : '2px solid #00c471',
                          }}
                        >
                          {user.role === 'admin' ? '일반회원으로' : '관리자로'}
                        </button>
                        <button onClick={() => handleDeleteUser(user._id)} style={{ ...deleteButtonStyle, fontWeight: 700 }}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 테이블 아래에 페이지네이션 UI 추가 (각 목록별로) */}
              {/* 예시: 회원 목록 */}
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage === 1} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', background: userPage === 1 ? '#eee' : '#fff', cursor: userPage === 1 ? 'not-allowed' : 'pointer' }}>이전</button>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{userPage} / {Math.ceil(userTotal / PAGE_LIMIT) || 1}</span>
                <button onClick={() => setUserPage((p) => (p < Math.ceil(userTotal / PAGE_LIMIT) ? p + 1 : p))} disabled={userPage >= Math.ceil(userTotal / PAGE_LIMIT)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', background: userPage >= Math.ceil(userTotal / PAGE_LIMIT) ? '#eee' : '#fff', cursor: userPage >= Math.ceil(userTotal / PAGE_LIMIT) ? 'not-allowed' : 'pointer' }}>다음</button>
              </div>
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
              {/* 테이블 아래에 페이지네이션 UI 추가 (각 목록별로) */}
              {/* 게임, 댓글 목록도 동일하게 페이지네이션 UI 추가 */}
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setGamePage((p) => Math.max(1, p - 1))} disabled={gamePage === 1} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', background: gamePage === 1 ? '#eee' : '#fff', cursor: gamePage === 1 ? 'not-allowed' : 'pointer' }}>이전</button>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{gamePage} / {Math.ceil(gameTotal / PAGE_LIMIT) || 1}</span>
                <button onClick={() => setGamePage((p) => (p < Math.ceil(gameTotal / PAGE_LIMIT) ? p + 1 : p))} disabled={gamePage >= Math.ceil(gameTotal / PAGE_LIMIT)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', background: gamePage >= Math.ceil(gameTotal / PAGE_LIMIT) ? '#eee' : '#fff', cursor: gamePage >= Math.ceil(gameTotal / PAGE_LIMIT) ? 'not-allowed' : 'pointer' }}>다음</button>
              </div>
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
              {/* 테이블 아래에 페이지네이션 UI 추가 (각 목록별로) */}
              {/* 게임, 댓글 목록도 동일하게 페이지네이션 UI 추가 */}
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setCommentPage((p) => Math.max(1, p - 1))} disabled={commentPage === 1} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', background: commentPage === 1 ? '#eee' : '#fff', cursor: commentPage === 1 ? 'not-allowed' : 'pointer' }}>이전</button>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{commentPage} / {Math.ceil(commentTotal / PAGE_LIMIT) || 1}</span>
                <button onClick={() => setCommentPage((p) => (p < Math.ceil(commentTotal / PAGE_LIMIT) ? p + 1 : p))} disabled={commentPage >= Math.ceil(commentTotal / PAGE_LIMIT)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', background: commentPage >= Math.ceil(commentTotal / PAGE_LIMIT) ? '#eee' : '#fff', cursor: commentPage >= Math.ceil(commentTotal / PAGE_LIMIT) ? 'not-allowed' : 'pointer' }}>다음</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const thStyle: React.CSSProperties = { border: '1px solid #ccc', padding: 8, backgroundColor: '#f2f2f2' };
const tdStyle: React.CSSProperties = { border: '1px solid #ccc', padding: 8, textAlign: 'center' };
const upgradeButtonStyle: React.CSSProperties = { padding: '6px 10px', marginRight: 8, backgroundColor: '#00c471', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' };
const downgradeButtonStyle: React.CSSProperties = { padding: '6px 10px', marginRight: 8, backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' };
const deleteButtonStyle: React.CSSProperties = { padding: '6px 10px', backgroundColor: '#d94350', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' };
