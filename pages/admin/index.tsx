// pages/admin/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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
  type: 'image' | 'gif' | 'youtube';
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
  const [allGames, setAllGames] = useState<Game[]>([]); // 댓글 매칭용 전체 게임 목록
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [sortBy, setSortBy] = useState<'email' | 'nickname' | 'createdAt'>('email');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const PAGE_LIMIT = 20;

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const userRoleData = localStorage.getItem('role');
    if (!userRoleData) {
      showNotification('ログインが必要です。', 'error');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }
    const role = JSON.parse(userRoleData).value;
    if (role !== 'admin') {
      showNotification('管理者 権限が必要です。', 'error');
      setTimeout(() => router.push('/'), 2000);
      return;
    }
    fetchUsers(userPage);
    fetchGames(gamePage);
    fetchAllGames(); // 댓글 매칭용 전체 게임 로드
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
                    if (!res.ok) throw new Error('회원 목록 요청에 실패했습니다.');
      const data = await res.json();
      setUsers(data.users || []);
      setUserTotal(data.total || 0);
    } catch (err) {
      console.error('에러:', err);
      showNotification('회원 목록 불러오기에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async (page = 1) => {
    try {
      const res = await fetch(`/api/admin/games?page=${page}&limit=${PAGE_LIMIT}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('게임 목록 요청에 실패했습니다.');
      const data = await res.json();
      setGames(data.games || []);
      setGameTotal(data.total || 0);
    } catch (err) {
      console.error('에러:', err);
      showNotification('게임 목록 불러오기에 실패했습니다.', 'error');
    }
  };

  // 댓글 매칭용 전체 게임 데이터 불러오기
  const fetchAllGames = async () => {
    try {
      const res = await fetch(`/api/admin/games?page=1&limit=10000`, { // 매우 큰 수로 더언 수 있도록
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('전체 게임 목록 요청에 실패했습니다.');
      const data = await res.json();
      setAllGames(data.games || []);
    } catch (err) {
      console.error('전체 게임 로드 에러:', err);
      // 에러가 있어도 댓글 관리는 계속 작동하도록 함
    }
  };

  const fetchComments = async (page = 1) => {
    try {
      const res = await fetch(`/api/admin/comments?page=${page}&limit=${PAGE_LIMIT}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('댓글 목록 요청에 실패했습니다.');
      const data = await res.json();
      setComments(data.comments || []);
      setCommentTotal(data.total || 0);
    } catch (err) {
      console.error('에러:', err);
      showNotification('댓글 목록 불러오기에 실패했습니다.', 'error');
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
        showNotification('회원이 삭제되었습니다.');
        fetchUsers(userPage);
      } else {
        const data = await res.json();
        showNotification(data.message || '삭제에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('エラー:', err);
      showNotification('서버 오류가 발생했습니다.', 'error');
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
        showNotification(`${newRole === 'admin' ? '관리자' : '일반사용자'}로 권한이 변경되었습니다.`);
        fetchUsers(userPage);
      } else {
        const data = await res.json();
        showNotification(data.message || '권한 변경에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('エラー:', err);
      showNotification('서버 오류가 발생했습니다.', 'error');
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
        showNotification('게임이 삭제되었습니다.');
        fetchGames(gamePage);
      } else {
        const data = await res.json();
        showNotification(data.message || '게임 삭제에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('エラー:', err);
      showNotification('서버 오류가 발생했습니다.', 'error');
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
        showNotification('댓글이 삭제되었습니다.');
        fetchComments(commentPage);
      } else {
        const data = await res.json();
        showNotification(data.message || '댓글 삭제에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('댓글 삭제 오류:', err);
      showNotification('서버 오류가 발생했습니다.', 'error');
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

    // 작성일 입력 (YYYY-MM-DD HH:mm)
    const currentDate = new Date(comment.createdAt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const defaultDateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth()+1)}-${pad(currentDate.getDate())} ${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}`;
    const newCreatedAtInput = prompt('새로운 작성일을 입력하세요. (YYYY-MM-DD HH:mm)', defaultDateStr);
    let newCreatedAt: string | undefined = undefined;
    if (newCreatedAtInput !== null && newCreatedAtInput.trim() !== '') {
      // 입력값을 Date로 변환 시도
      const dateStr = newCreatedAtInput.replace(' ', 'T');
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        alert('날짜 형식이 올바르지 않습니다. (예: 2024-05-01 13:30)');
        return;
      }
      newCreatedAt = parsed.toISOString();
    }

    try {
      const res = await fetch('/api/admin/updateComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          commentId: comment._id,
          newContent,
          newReportCount,
          ...(newCreatedAt ? { newCreatedAt } : {})
        }),
      });
      if (res.ok) {
        showNotification('댓글이 수정되었습니다.');
        fetchComments(commentPage);
      } else {
        const data = await res.json();
        showNotification(data.message || '댓글 수정에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('댓글 수정 오류:', err);
      showNotification('서버 오류가 발생했습니다.', 'error');
    }
  };
  

  // 필터링된 사용자 목록 (검색어, 역할 필터 적용)
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.nickname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: '4px solid #f3f3f3', 
          borderTop: '4px solid #00c471',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite' 
        }} />
        <div>관리자 페이지를 불러오는 중...</div>
      </div>
    );
  }

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
      <Head>
        <title>관리자 페이지 - 스키토</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Header />
      
      {/* 알림 시스템 */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 20,
          background: notification.type === 'success' ? '#00c471' : '#d94350',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontWeight: 600,
          maxWidth: 400,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {notification.message}
        </div>
      )}
      
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px 0' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: 32, marginBottom: 8, letterSpacing: -1, background: 'linear-gradient(45deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🛠️ 관리자 대시보드</h1>
              <p style={{ color: '#666', fontSize: 16 }}>사용자, 게임, 댓글을 효율적으로 관리하세요</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ padding: '8px 16px', background: '#e8f5e8', borderRadius: 20, fontSize: 14, fontWeight: 600, color: '#00c471' }}>
                전체 회원: {userTotal}명
              </div>
              <div style={{ padding: '8px 16px', background: '#e8f0ff', borderRadius: 20, fontSize: 14, fontWeight: 600, color: '#4285f4' }}>
                전체 게임: {gameTotal}개
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: 32, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setTab('users')} style={modernTabStyle(tab === 'users')}>
              👥 회원 관리
            </button>
            <button onClick={() => setTab('games')} style={modernTabStyle(tab === 'games')}>
              🎮 게임 관리
            </button>
            <button onClick={() => setTab('comments')} style={modernTabStyle(tab === 'comments')}>
              💬 댓글 관리
            </button>
          </div>

          {tab === 'users' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontWeight: 800, fontSize: 24, color: '#333' }}>👥 회원 관리 ({filteredUsers.length}명)</h2>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="이메일 또는 닉네임 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInputStyle}
                  />
                  <select 
                    value={filterRole} 
                    onChange={(e) => setFilterRole(e.target.value as any)}
                    style={selectStyle}
                  >
                    <option value="all">모든 권한</option>
                    <option value="admin">관리자</option>
                    <option value="user">일반사용자</option>
                  </select>
                </div>
              </div>
              <div style={tableContainerStyle}>
                <table style={modernTableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>이메일</th>
                    <th style={thStyle}>닉네임</th>
                    <th style={thStyle}>권한</th>
                    <th style={thStyle}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
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
                        <button onClick={() => handleDeleteUser(user._id)} style={{ ...deleteButtonStyle, fontWeight: 700 }}>削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                <button 
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))} 
                  disabled={userPage === 1} 
                  style={paginationButtonStyle(userPage === 1)}
                >
                  ← 이전
                </button>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: 16, 
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 20,
                  minWidth: 80,
                  textAlign: 'center'
                }}>
                  {userPage} / {Math.ceil(userTotal / PAGE_LIMIT) || 1}
                </span>
                <button 
                  onClick={() => setUserPage((p) => (p < Math.ceil(userTotal / PAGE_LIMIT) ? p + 1 : p))} 
                  disabled={userPage >= Math.ceil(userTotal / PAGE_LIMIT)} 
                  style={paginationButtonStyle(userPage >= Math.ceil(userTotal / PAGE_LIMIT))}
                >
                  다음 →
                </button>
              </div>
            </>
          )}

          {tab === 'games' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontWeight: 800, fontSize: 24, color: '#333' }}>🎮 게임 관리 ({games.length}개)</h2>
                <div style={{ padding: '8px 16px', background: '#fff3e0', borderRadius: 20, fontSize: 14, fontWeight: 600, color: '#f57f17' }}>
                  전체 게임: {gameTotal}개
                </div>
              </div>
              <div style={tableContainerStyle}>
                <table style={modernTableStyle}>
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
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                <button 
                  onClick={() => setGamePage((p) => Math.max(1, p - 1))} 
                  disabled={gamePage === 1} 
                  style={paginationButtonStyle(gamePage === 1)}
                >
                  ← 이전
                </button>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: 16, 
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 20,
                  minWidth: 80,
                  textAlign: 'center'
                }}>
                  {gamePage} / {Math.ceil(gameTotal / PAGE_LIMIT) || 1}
                </span>
                <button 
                  onClick={() => setGamePage((p) => (p < Math.ceil(gameTotal / PAGE_LIMIT) ? p + 1 : p))} 
                  disabled={gamePage >= Math.ceil(gameTotal / PAGE_LIMIT)} 
                  style={paginationButtonStyle(gamePage >= Math.ceil(gameTotal / PAGE_LIMIT))}
                >
                  다음 →
                </button>
              </div>
            </>
          )}

          {tab === 'comments' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontWeight: 800, fontSize: 24, color: '#333' }}>💬 댓글 관리 ({comments.length}개)</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ padding: '8px 16px', background: '#ffebee', borderRadius: 20, fontSize: 14, fontWeight: 600, color: '#d32f2f' }}>
                    신고 댓글: {comments.filter(c => c.reportCount >= 3).length}개
                  </div>
                  <div style={{ padding: '8px 16px', background: '#e8f5e8', borderRadius: 20, fontSize: 14, fontWeight: 600, color: '#388e3c' }}>
                    전체 댓글: {commentTotal}개
                  </div>
                </div>
              </div>
              <div style={tableContainerStyle}>
                <table style={modernTableStyle}>
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
                    const relatedGame = allGames.find(game => game._id === comment.gameId);
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
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                <button 
                  onClick={() => setCommentPage((p) => Math.max(1, p - 1))} 
                  disabled={commentPage === 1} 
                  style={paginationButtonStyle(commentPage === 1)}
                >
                  ← 이전
                </button>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: 16, 
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 20,
                  minWidth: 80,
                  textAlign: 'center'
                }}>
                  {commentPage} / {Math.ceil(commentTotal / PAGE_LIMIT) || 1}
                </span>
                <button 
                  onClick={() => setCommentPage((p) => (p < Math.ceil(commentTotal / PAGE_LIMIT) ? p + 1 : p))} 
                  disabled={commentPage >= Math.ceil(commentTotal / PAGE_LIMIT)} 
                  style={paginationButtonStyle(commentPage >= Math.ceil(commentTotal / PAGE_LIMIT))}
                >
                  다음 →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// 현대적인 스타일 정의
const modernTabStyle = (active: boolean): React.CSSProperties => ({
  padding: '12px 24px',
  fontWeight: 600,
  fontSize: 16,
  borderRadius: 25,
  border: 'none',
  background: active 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    : 'rgba(255, 255, 255, 0.8)',
  color: active ? '#fff' : '#666',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(10px)',
  boxShadow: active 
    ? '0 8px 25px rgba(102, 126, 234, 0.3)' 
    : '0 2px 8px rgba(0,0,0,0.1)',
});

const searchInputStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: '2px solid #e1e5e9',
  borderRadius: 25,
  fontSize: 14,
  width: 250,
  outline: 'none',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
};

const selectStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: '2px solid #e1e5e9',
  borderRadius: 25,
  fontSize: 14,
  outline: 'none',
  background: 'rgba(255, 255, 255, 0.9)',
  cursor: 'pointer',
};

const tableContainerStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  backdropFilter: 'blur(10px)',
};

const modernTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  background: 'transparent',
};

const thStyle: React.CSSProperties = { 
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  padding: '16px 12px', 
  fontWeight: 700,
  color: '#495057',
  textAlign: 'center',
  fontSize: 14,
  borderBottom: '2px solid #dee2e6',
};

const tdStyle: React.CSSProperties = { 
  padding: '16px 12px', 
  textAlign: 'center',
  borderBottom: '1px solid #f1f3f4',
  fontSize: 14,
  verticalAlign: 'middle',
};

const modernButtonStyle = (variant: 'primary' | 'warning' | 'danger'): React.CSSProperties => {
  const colors = {
    primary: { bg: '#00c471', hover: '#00a85f' },
    warning: { bg: '#ff9800', hover: '#f57c00' },
    danger: { bg: '#d94350', hover: '#c62828' }
  };
  
  return {
    padding: '8px 16px',
    margin: '0 4px',
    backgroundColor: colors[variant].bg,
    color: 'white',
    border: 'none',
    borderRadius: 20,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  };
};

const upgradeButtonStyle = modernButtonStyle('primary');
const downgradeButtonStyle = modernButtonStyle('warning');
const deleteButtonStyle = modernButtonStyle('danger');

const paginationButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '10px 20px',
  borderRadius: 25,
  border: '2px solid',
  borderColor: disabled ? '#e1e5e9' : '#667eea',
  background: disabled ? '#f8f9fa' : 'rgba(102, 126, 234, 0.1)',
  color: disabled ? '#adb5bd' : '#667eea',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 14,
  fontWeight: 600,
  transition: 'all 0.3s ease',
  opacity: disabled ? 0.5 : 1,
});

// CSS 애니메이션을 위한 스타일 추가
const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    0% {
      transform: translateX(100%);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
`;

// 스타일을 document head에 추가
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}
