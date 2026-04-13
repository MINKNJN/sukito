// pages/admin/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '@/components/Header';
import { useAlert } from '@/lib/alert';

interface User {
  userId: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface Game {
  _id: string;
  title: string;
  desc: string;
  itemsCount: number;
  visibility: string;
}

interface Comment {
  _id: string;
  gameTitle: string;
  nickname: string;
  content: string;
  createdAt: string;
  reportCount: number;
}

type Tab = 'users' | 'games' | 'comments';
type ConfirmState = { message: string; onConfirm: () => void } | null;
type EditingComment = { id: string; content: string; reportCount: number } | null;

const PAGE_LIMIT = 20;

export default function AdminPage() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<Tab>('users');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');

  const [games, setGames] = useState<Game[]>([]);
  const [gameTotal, setGameTotal] = useState(0);
  const [gamePage, setGamePage] = useState(1);
  const [gameSearch, setGameSearch] = useState('');

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentPage, setCommentPage] = useState(1);
  const [commentSearch, setCommentSearch] = useState('');
  const [editingComment, setEditingComment] = useState<EditingComment>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token') || '';
    return { Authorization: `Bearer ${token}` };
  };

  // 권한 확인
  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('ログインしてください。', 'error');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }
      const res = await fetch('/api/admin/users?page=1&limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        showAlert('ログインが無効です。', 'error');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }
      if (res.status === 403) {
        showAlert('管理者のみアクセスできます。', 'error');
        setTimeout(() => router.push('/'), 1500);
        return;
      }
      setAuthChecked(true);
      fetchUsers(1);
      fetchGames(1);
      fetchComments(1);
    };
    check();
    // eslint-disable-next-line
  }, []);

  useEffect(() => { if (authChecked) fetchUsers(userPage); }, [userPage]);
  useEffect(() => { if (authChecked) fetchGames(gamePage); }, [gamePage]);
  useEffect(() => { if (authChecked) fetchComments(commentPage); }, [commentPage]);
  useEffect(() => {
    setUserPage(1);
    setGamePage(1);
    setCommentPage(1);
    setEditingComment(null);
  }, [tab]);

  const fetchUsers = async (page: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (userSearch) params.set('search', userSearch);
    if (userRole) params.set('role', userRole);
    try {
      const res = await fetch(`/api/admin/users?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setUsers(data.users || []);
      setUserTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async (page: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (gameSearch) params.set('search', gameSearch);
    try {
      const res = await fetch(`/api/admin/games?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setGames(data.games || []);
      setGameTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (page: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (commentSearch) params.set('search', commentSearch);
    try {
      const res = await fetch(`/api/admin/comments?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setComments(data.comments || []);
      setCommentTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const doConfirm = (message: string, onConfirm: () => void) => setConfirm({ message, onConfirm });

  const deleteUser = (id: string) => doConfirm('이 회원을 삭제할까요?', async () => {
    setConfirm(null);
    const res = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ userId: id }),
    });
    res.ok ? (showToast('삭제했습니다.'), fetchUsers(userPage)) : showToast('삭제에 실패했습니다.', false);
  });

  const toggleRole = (id: string, current: string) => {
    const next = current === 'admin' ? 'user' : 'admin';
    doConfirm(`${next === 'admin' ? '관리자' : '일반회원'}으로 변경할까요?`, async () => {
      setConfirm(null);
      const res = await fetch('/api/admin/updateRole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ userId: id, newRole: next }),
      });
      res.ok ? (showToast('권한을 변경했습니다.'), fetchUsers(userPage)) : showToast('변경에 실패했습니다.', false);
    });
  };

  const deleteGame = (id: string) => doConfirm('이 게임을 삭제할까요?', async () => {
    setConfirm(null);
    const res = await fetch('/api/admin/deleteGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ gameId: id }),
    });
    res.ok ? (showToast('삭제했습니다.'), fetchGames(gamePage)) : showToast('삭제에 실패했습니다.', false);
  });

  const deleteComment = (id: string) => doConfirm('이 댓글을 삭제할까요?', async () => {
    setConfirm(null);
    const res = await fetch('/api/admin/deleteComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ commentId: id }),
    });
    res.ok ? (showToast('삭제했습니다.'), fetchComments(commentPage)) : showToast('삭제에 실패했습니다.', false);
  });

  const saveComment = async () => {
    if (!editingComment) return;
    const res = await fetch('/api/admin/updateComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        commentId: editingComment.id,
        newContent: editingComment.content,
        newReportCount: editingComment.reportCount,
      }),
    });
    if (res.ok) {
      showToast('저장했습니다.');
      setEditingComment(null);
      fetchComments(commentPage);
    } else {
      showToast('저장에 실패했습니다.', false);
    }
  };

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('ko-KR') : '-';

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6b7280', fontSize: 15 }}>
        권한 확인 중...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>관리자 - 스키토</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Header />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 72, right: 20, zIndex: 9999,
          padding: '10px 20px', borderRadius: 6,
          background: toast.ok ? '#22c55e' : '#ef4444',
          color: '#fff', fontWeight: 600, fontSize: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* 확인 모달 */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '28px 32px', minWidth: 280, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <p style={{ marginBottom: 20, fontSize: 15, color: '#333' }}>{confirm.message}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setConfirm(null)} style={btn('#f3f4f6', '#374151')}>취소</button>
              <button onClick={confirm.onConfirm} style={btn('#ef4444', '#fff')}>확인</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>관리자 대시보드</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={badge('#f0fdf4', '#16a34a')}>회원 {userTotal}명</span>
            <span style={badge('#eff6ff', '#2563eb')}>게임 {gameTotal}개</span>
            <span style={badge('#fefce8', '#ca8a04')}>댓글 {commentTotal}개</span>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
          {(['users', 'games', 'comments'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? '#111' : '#9ca3af',
              borderBottom: tab === t ? '2px solid #111' : '2px solid transparent',
              marginBottom: -2,
            }}>
              {{ users: '회원 관리', games: '게임 관리', comments: '댓글 관리' }[t]}
            </button>
          ))}
        </div>

        {/* 회원 탭 */}
        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                placeholder="이메일 / 닉네임 검색"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
                style={inputSt}
              />
              <select value={userRole} onChange={e => { setUserRole(e.target.value); setUserPage(1); }} style={selectSt}>
                <option value="">전체 권한</option>
                <option value="admin">관리자</option>
                <option value="user">일반회원</option>
              </select>
              <button onClick={() => fetchUsers(1)} style={btn('#111', '#fff')}>검색</button>
            </div>

            <table style={tableSt}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={th}>이메일</th>
                  <th style={th}>닉네임</th>
                  <th style={th}>권한</th>
                  <th style={th}>가입일</th>
                  <th style={th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={loadingTd}>불러오는 중...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} style={loadingTd}>회원이 없습니다.</td></tr>
                ) : users.map(u => (
                  <tr key={u.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={td}>{u.email}</td>
                    <td style={td}>{u.nickname}</td>
                    <td style={td}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: u.role === 'admin' ? '#fef3c7' : '#f3f4f6',
                        color: u.role === 'admin' ? '#92400e' : '#6b7280',
                      }}>
                        {u.role === 'admin' ? '관리자' : '일반회원'}
                      </span>
                    </td>
                    <td style={td}>{fmt(u.createdAt)}</td>
                    <td style={td}>
                      <button onClick={() => toggleRole(u.userId, u.role)} style={smBtn('#f3f4f6', '#374151')}>
                        {u.role === 'admin' ? '일반으로' : '관리자로'}
                      </button>
                      <button onClick={() => deleteUser(u.userId)} style={smBtn('#fee2e2', '#dc2626')}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={userPage} total={userTotal} onChange={setUserPage} />
          </>
        )}

        {/* 게임 탭 */}
        {tab === 'games' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                placeholder="게임 제목 검색"
                value={gameSearch}
                onChange={e => setGameSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchGames(1)}
                style={inputSt}
              />
              <button onClick={() => fetchGames(1)} style={btn('#111', '#fff')}>검색</button>
            </div>

            <table style={tableSt}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={th}>제목</th>
                  <th style={th}>설명</th>
                  <th style={th}>공개</th>
                  <th style={th}>아이템</th>
                  <th style={th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={loadingTd}>불러오는 중...</td></tr>
                ) : games.length === 0 ? (
                  <tr><td colSpan={5} style={loadingTd}>게임이 없습니다.</td></tr>
                ) : games.map(g => (
                  <tr key={g._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={td}>{g.title}</td>
                    <td style={{ ...td, color: '#6b7280', maxWidth: 260 }}>
                      {g.desc?.length > 50 ? g.desc.slice(0, 50) + '...' : g.desc}
                    </td>
                    <td style={td}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: g.visibility === 'public' ? '#dcfce7' : '#f3f4f6',
                        color: g.visibility === 'public' ? '#16a34a' : '#6b7280',
                      }}>
                        {g.visibility === 'public' ? '공개' : g.visibility === 'private' ? '비공개' : '비밀번호'}
                      </span>
                    </td>
                    <td style={td}>{g.itemsCount}개</td>
                    <td style={td}>
                      <button onClick={() => router.push(`/make?id=${g._id}`)} style={smBtn('#f3f4f6', '#374151')}>수정</button>
                      <button onClick={() => deleteGame(g._id)} style={smBtn('#fee2e2', '#dc2626')}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={gamePage} total={gameTotal} onChange={setGamePage} />
          </>
        )}

        {/* 댓글 탭 */}
        {tab === 'comments' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                placeholder="댓글 내용 검색"
                value={commentSearch}
                onChange={e => setCommentSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchComments(1)}
                style={inputSt}
              />
              <button onClick={() => fetchComments(1)} style={btn('#111', '#fff')}>검색</button>
            </div>

            <table style={tableSt}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={th}>게임명</th>
                  <th style={th}>작성자</th>
                  <th style={th}>댓글 내용</th>
                  <th style={th}>신고</th>
                  <th style={th}>작성일</th>
                  <th style={th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={loadingTd}>불러오는 중...</td></tr>
                ) : comments.length === 0 ? (
                  <tr><td colSpan={6} style={loadingTd}>댓글이 없습니다.</td></tr>
                ) : comments.map(c => {
                  const isEditing = editingComment?.id === c._id;
                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid #f3f4f6', background: c.reportCount >= 3 ? '#fff7f7' : '#fff' }}>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {c.gameTitle || <span style={{ color: '#9ca3af' }}>삭제된 게임</span>}
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{c.nickname}</td>
                      <td style={{ ...td, maxWidth: 280 }}>
                        {isEditing ? (
                          <textarea
                            value={editingComment.content}
                            onChange={e => setEditingComment({ ...editingComment, content: e.target.value })}
                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, resize: 'vertical', minHeight: 60 }}
                          />
                        ) : c.content}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingComment.reportCount}
                            onChange={e => setEditingComment({ ...editingComment, reportCount: Number(e.target.value) })}
                            style={{ width: 56, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, textAlign: 'center' }}
                          />
                        ) : (
                          <span style={{ color: c.reportCount >= 3 ? '#dc2626' : '#374151', fontWeight: c.reportCount >= 3 ? 700 : 400 }}>
                            {c.reportCount}
                          </span>
                        )}
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmt(c.createdAt)}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <>
                            <button onClick={saveComment} style={smBtn('#dcfce7', '#16a34a')}>저장</button>
                            <button onClick={() => setEditingComment(null)} style={smBtn('#f3f4f6', '#374151')}>취소</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingComment({ id: c._id, content: c.content, reportCount: c.reportCount })} style={smBtn('#f3f4f6', '#374151')}>수정</button>
                            <button onClick={() => deleteComment(c._id)} style={smBtn('#fee2e2', '#dc2626')}>삭제</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={commentPage} total={commentTotal} onChange={setCommentPage} />
          </>
        )}
      </div>
    </>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={pgBtn(page === 1)}>이전</button>
      <span style={{ fontSize: 14, color: '#374151' }}>{page} / {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} style={pgBtn(page >= pages)}>다음</button>
    </div>
  );
}

// 스타일
const tableSt: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' };
const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13, borderBottom: '1px solid #e5e7eb' };
const td: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'middle', color: '#374151' };
const loadingTd: React.CSSProperties = { textAlign: 'center', padding: '32px 0', color: '#9ca3af' };
const inputSt: React.CSSProperties = { flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none' };
const selectSt: React.CSSProperties = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff' };
const btn = (bg: string, color: string): React.CSSProperties => ({ padding: '8px 16px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 });
const smBtn = (bg: string, color: string): React.CSSProperties => ({ marginRight: 6, padding: '4px 10px', background: bg, color, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 500 });
const pgBtn = (disabled: boolean): React.CSSProperties => ({ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 6, background: disabled ? '#f9fafb' : '#fff', color: disabled ? '#9ca3af' : '#374151', cursor: disabled ? 'default' : 'pointer', fontSize: 14 });
const badge = (bg: string, color: string): React.CSSProperties => ({ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: bg, color });
