// pages/result.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import { convertToThumbnail } from '@/lib/utils';
import { getStorageWithExpire } from '@/lib/utils';
import GoogleAd from '@/components/GoogleAd';
import { useAlert } from '@/lib/alert';


export default function ResultPage() {
  const router = useRouter();
  const { id } = router.query;

  const [winner, setWinner] = useState<{ name: string; url: string } | null>(null);
  const [ranking, setRanking] = useState<{ name: string; url: string; count: number }[]>([]);
  const [totalPlays, setTotalPlays] = useState<number>(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [nickname, setNickname] = useState('ゲスト');
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const maxCommentLength = 200;
  const [isMyWinner, setIsMyWinner] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [gameInfo, setGameInfo] = useState<{ title: string; desc: string } | null>(null);
  const { showAlert, showConfirm } = useAlert();

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/result?id=${id}` : '';
  const COMMENTS_PER_PAGE = 20;

  useEffect(() => {
    if (!id) return;

    const local = localStorage.getItem(`sukito_winner_${id}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed?.name && parsed?.url) {
          setWinner(parsed);
          setIsMyWinner(true);
        }
      } catch (e) {
        console.warn('ローカルwinner読込エラー:', e);
      }
    }

    fetch(`/api/winner?id=${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!local && data?.winner) {
          setWinner(data.winner);
          setIsMyWinner(false);
        }
      });

    fetch(`/api/ranking?id=${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.ranking) {
          setRanking(data.ranking);
          setTotalPlays(data.totalPlays || 0);
        }
      });

    fetchComments();

    // 게임 정보 가져오기
    fetch(`/api/games/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setGameInfo({ title: data.title, desc: data.desc });
        }
      })
      .catch(err => console.error('게임 정보 로드 실패:', err));

    const localNickname = getStorageWithExpire('nickname');
    if (localNickname) {
      setNickname(localNickname);
    }

    // 로그인 체크 및 닉네임 기본값 설정
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetch('/api/jwt', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          // userName(닉네임)이 있으면 사용, 없으면 'ゲスト'
          if (data?.user?.userName && data.user.userName.trim()) {
            setNickname(data.user.userName);
          } else if (data?.userName && data.userName.trim()) {
            setNickname(data.userName);
          } else {
            setNickname('ゲスト');
          }
          // 로그인 사용자의 userId 저장
          if (data?.user?.userId) {
            setCurrentUserId(data.user.userId);
          }
        })
        .catch(() => setNickname('ゲスト'));
    } else {
      setNickname('ゲスト');
      // 비로그인 사용자를 위한 세션 ID 생성
      let guestSessionId = localStorage.getItem('guestSessionId');
      if (!guestSessionId) {
        guestSessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestSessionId', guestSessionId);
      }
      setSessionId(guestSessionId);
    }
  }, [id]);

  const fetchComments = async (page = 1) => {
    try {
      const res = await fetch(`/api/comments?id=${id}&page=${page}&limit=${COMMENTS_PER_PAGE}`);
      if (res.ok) {
        const data = await res.json();
        if (page === 1) {
          setComments(data.comments || []);
        } else {
          setComments(prev => [...prev, ...(data.comments || [])]);
        }
        setHasMoreComments((data.comments || []).length === COMMENTS_PER_PAGE);
      }
    } catch (err) {
      console.error('コメント読み込みエラー:', err);
    }
  };

  const loadMoreComments = () => {
    const nextPage = commentPage + 1;
    setCommentPage(nextPage);
    fetchComments(nextPage);
  };

  const winnerRank = ranking.findIndex(r => r.name === winner?.name && r.url === winner?.url) + 1;
  const top10 = ranking.slice(0, 10);
  const topNames = top10.map(r => r.name).join(', ');
  const filteredRanking = ranking.filter(item => item.name.includes(searchKeyword));

  const handleCommentSubmit = async () => {
    if (!nickname.trim()) {
      showAlert('ニックネームを入力してください。', 'error');
      return;
    }
    if (!commentContent.trim()) {
      showAlert('コメントを入力してください。', 'error');
      return;
    }

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: id,
          nickname: nickname.trim(),
          content: commentContent.trim(),
          userId: currentUserId || undefined,
          sessionId: sessionId || undefined
        })
      });

      if (res.ok) {
        setCommentPage(1);
        fetchComments(1);
        setCommentContent('');
      } else {
        showAlert('コメントエラー', 'error');
      }
    } catch (err) {
      console.error('エラー:', err);
      showAlert('ネットワークエラー', 'error');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showAlert('リンクコピー', 'success');
    } catch {
      showAlert('リンクコピーエラー', 'error');
    }
  };

  const handleLikeComment = async (comment: { _id: string; likes: number; dislikes: number; likeUsers: string[]; dislikeUsers: string[] }, action: 'like' | 'dislike' | 'unlike' | 'undislike') => {
    try {
      const res = await fetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: comment._id,
          action,
          userId: currentUserId || undefined,
          sessionId: sessionId || undefined
        })
      });

      if (res.ok) {
        // コメントリスト更新
        setCommentPage(1);
        fetchComments(1);
      } else {
        showAlert('アクションエラー', 'error');
      }
    } catch (err) {
      console.error('エラー:', err);
      showAlert('ネットワークエラー', 'error');
    }
  };

  const handleDeleteComment = async (comment: { _id: string; nickname: string; authorId: string; authorType: string }) => {
    showConfirm('このコメントを削除しますか？', async () => {
      try {
        const res = await fetch('/api/comments/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commentId: comment._id,
            userId: currentUserId || undefined,
            sessionId: sessionId || undefined
          })
        });

        if (res.ok) {
          showAlert('コメント削除完了', 'success');
          setCommentPage(1);
          fetchComments(1);
        } else {
          const data = await res.json();
          showAlert(data.message || '削除エラー', 'error');
        }
      } catch (err) {
        console.error('エラー:', err);
        showAlert('ネットワークエラー', 'error');
      }
    });
  };

  const handleEditComment = (comment: { _id: string; content: string; nickname: string; authorId: string; authorType: string }) => {
    // 投稿者確認
    let isAuthor = false;
    
    if (currentUserId && comment.authorType === 'user') {
      isAuthor = comment.authorId === currentUserId;
    } else if (sessionId && comment.authorType === 'guest') {
      isAuthor = comment.authorId === sessionId;
    }

    if (!isAuthor) {
      showAlert('自分のコメントのみ編集できます。', 'error');
      return;
    }
    
    setEditingCommentId(comment._id);
    setEditingContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editingContent.trim()) {
      showAlert('コメント内容を入力してください。', 'error');
      return;
    }

    try {
      const res = await fetch('/api/comments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: editingCommentId,
          content: editingContent.trim(),
          userId: currentUserId || undefined,
          sessionId: sessionId || undefined
        })
      });

      if (res.ok) {
        showAlert('コメント編集完了', 'success');
        setCommentPage(1);
        fetchComments(1);
        setEditingCommentId(null);
        setEditingContent('');
      } else {
        const data = await res.json();
        showAlert(data.message || '編集エラー', 'error');
      }
    } catch (err) {
      console.error('エラー:', err);
      showAlert('ネットワークエラー', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  if (!id) return <div>お待ちください。</div>;

  const title = winner ? `${winner.name} - スキト結果` : 'スキト結果';
  const description = winner
    ? `${isMyWinner ? 'あなたが選んだ' : '多くの人が選んだ'}最終優勝者は ${winner.name} です！ Top 10: ${topNames}`
    : '優勝者をチェックしよう！';
  const image = winner ? convertToThumbnail(winner.url) : '/og-image.png';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={`https://sukito.net/result?id=${id}`} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <link rel="canonical" href={`https://sukito.jp/result?id=${id}`} />
      </Head>
      <Header />
      <div style={{ padding: 24 }}>
        {/* 광고를 콘텐츠 섹션으로 감싸기 */}
        <section style={{
          backgroundColor: '#f8f9fa',
          padding: '20px 16px',
          marginBottom: 24,
          borderRadius: '8px',
          border: '1px solid #e9ecef',
        }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            marginBottom: 16, 
            textAlign: 'center',
            color: '#495057'
          }}>
            📢 スポンサー広告
          </h3>
          <div style={{ 
            height: 100, 
            border: '2px dashed #ccc', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#fff',
            borderRadius: '6px'
          }}>
            <GoogleAd />
          </div>
        </section>

        {winner ? (
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              🏆 {isMyWinner ? 'あなたが選んだ最終優勝者' : '多くの人が選んだ優勝者'}
            </h1>
            {/* GIF(WEBP, mp4) 타입이면 video, 아니면 img */}
            {winner.url.endsWith('.mp4') ? (
              <video
                src={winner.url}
                autoPlay
                loop
                muted
                playsInline
                style={{maxWidth: '300px', objectFit: 'cover', borderRadius: '12px', border: '4px solid gold', boxShadow: '0 0 12px rgba(255,215,0,0.6)', margin: '0 auto', display: 'block'}}
              />
            ) : (
              <img
                src={convertToThumbnail(winner.url)}
                alt={winner.name}
                style={{maxWidth: '300px', objectFit: 'cover', borderRadius: '12px', border: '4px solid gold', boxShadow: '0 0 12px rgba(255,215,0,0.6)', margin: '0 auto', display: 'block'}}
              />
            )}
            <h2 style={{ fontSize: '2rem', marginTop: '1rem' }}>{winner.name}</h2>
            {winnerRank > 0 && <p style={{ fontSize: '1rem', color: '#ccc' }}>総合ランキング {winnerRank}位</p>}
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => setIsShareOpen(!isShareOpen)} style={{ padding: '10px 20px', fontSize: '1rem', borderRadius: '6px', backgroundColor: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}>📤 シェア</button>
              <button onClick={() => router.push(`/play/${id}`)} style={{ padding: '10px 20px', fontSize: '1rem', borderRadius: '6px', backgroundColor: '#00c471', color: 'white', border: 'none', cursor: 'pointer' }}>🔁 再プレイ</button>
            </div>
            {isShareOpen && (
              <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('スキト結果')}`, '_blank')} style={{ backgroundColor: '#1DA1F2', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>X</button>
                <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')} style={{ backgroundColor: '#1877F2', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>FaceBook</button>
                <button onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, '_blank')} style={{ backgroundColor: '#00C300', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>LINE</button>
                <button onClick={copyLink} style={{ backgroundColor: '#999', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>リンクコピー</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏆 最終優勝者</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>プレイ履歴がないか、まだ優勝者が決まっていません。</p>
            <button onClick={() => router.push(`/play/${id}`)} style={{ padding: '10px 20px', fontSize: '1rem', borderRadius: '6px', backgroundColor: '#00c471', color: 'white', border: 'none', cursor: 'pointer' }}>👉 プレイする</button>
          </div>
        )}

        {gameInfo && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#495057' }}>{gameInfo.title}</h2>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>{gameInfo.desc}</p>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <h1>🔥 総合ランキング (Top 10)</h1>
          <input 
            type="text" 
            placeholder="検索" 
            value={searchKeyword} 
            onChange={(e) => setSearchKeyword(e.target.value)} 
            style={{ 
              padding: '12px 16px', 
              width: '200px', 
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
              backgroundColor: '#fff',
              minWidth: '200px'
            }} 
          />
        </div>
        {(searchKeyword ? filteredRanking : top10).length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ backgroundColor: '#eee' }}>
                <th style={{ padding: 8 }}>順位</th>
                <th style={{ padding: 8 }}>画像</th>
                <th style={{ padding: 8 }}>名前</th>
                <th style={{ padding: 8 }}>優勝回数</th>
                <th style={{ padding: 8 }}>優勝率</th>
              </tr>
            </thead>
            <tbody>
              {(searchKeyword ? filteredRanking : top10).map((item, idx) => {
                const rankIndex = ranking.findIndex(r => r.name === item.name && r.url === item.url);
                const percentage = totalPlays ? (item.count / totalPlays * 100).toFixed(2) : '0';
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: 8 }}>{rankIndex + 1}</td>
                    <td style={{ padding: 8 }}>
                      {item.url.endsWith('.mp4') ? (
                        <video
                          src={item.url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          width={100}
                          height={150}
                          style={{ objectFit: 'cover', borderRadius: 8, background: '#000' }}
                        />
                      ) : (
                        <img
                          src={convertToThumbnail(item.url)}
                          alt={`${item.name} - 투표 결과`}
                          width={100}
                          height={150}
                          style={{ objectFit: 'cover', borderRadius: 8, background: '#000' }}
                        />
                      )}
                    </td>
                    <td style={{ padding: 8 }}>{item.name}</td>
                    <td style={{ padding: 8 }}>{item.count}回</td>
                    <td style={{ padding: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ backgroundColor: '#ffccd5', width: '100%', height: 10, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, backgroundColor: '#ff4d6d', height: '100%' }}></div>
                        </div>
                        <span style={{ minWidth: 50 }}>{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p>まだプレイ履歴がありません。</p>}

        <div style={{ width: '100%', height: 100, border: '2px dashed #ccc', margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GoogleAd />
        </div>

        <h1>💬 コメント</h1>
        <div style={{ 
          marginTop: 16, 
          padding: '16px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="ニックネーム"
              maxLength={20}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                fontSize: 14, 
                borderRadius: 6, 
                border: '1px solid #ccc',
                backgroundColor: '#fff'
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <textarea 
              value={commentContent} 
              onChange={(e) => setCommentContent(e.target.value)} 
              placeholder="コメントを入力してください" 
              rows={4} 
              maxLength={maxCommentLength} 
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                fontSize: 14,
                borderRadius: 6,
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                resize: 'vertical'
              }} 
            />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: 12, color: '#666' }}>
              {commentContent.length} / {maxCommentLength}
            </div>
            <button 
              onClick={handleCommentSubmit} 
              style={{ 
                padding: '8px 16px',
                fontSize: 14,
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
            >
              コメントする
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          {comments.length > 0 ? (
            <>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {comments.map((c, idx) => {
                  const userIdentifier = currentUserId || sessionId;
                  const hasLiked = c.likeUsers?.includes(userIdentifier) || false;
                  const hasDisliked = c.dislikeUsers?.includes(userIdentifier) || false;
                  const isAuthor = (currentUserId && c.authorType === 'user' && c.authorId === currentUserId) || 
                                 (sessionId && c.authorType === 'guest' && c.authorId === sessionId);
                  
                  // 固定コメント条件: いいねが3個以上なら固定コメント
                  const isPinned = (c.likes || 0) >= 3;

                  return (
                    <li key={idx} style={{ 
                      marginBottom: 16, 
                      padding: '16px', 
                      border: isPinned ? '2px solid #ffd700' : '1px solid #e0e0e0', 
                      borderRadius: '8px',
                      backgroundColor: isPinned ? '#fffbf0' : '#fff',
                      position: 'relative'
                    }}>
                      {isPinned && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '12px',
                          backgroundColor: '#ffd700',
                          color: '#333',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          zIndex: 1,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          📌 固定コメント
                        </div>
                      )}
                      {editingCommentId === c._id ? (
                        <div style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ fontSize: '14px', color: '#333' }}>{c.nickname}</strong>
                          </div>
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                            maxLength={maxCommentLength}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '8px' }}
                          />
                          <div style={{ textAlign: 'right', fontSize: 12, color: '#666', marginBottom: '8px' }}>
                            {editingContent.length} / {maxCommentLength}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={handleUpdateComment}
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: 12, 
                                backgroundColor: '#0070f3', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: 4, 
                                cursor: 'pointer' 
                              }}
                            >
                              保存
                            </button>
                            <button 
                              onClick={cancelEdit}
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: 12, 
                                backgroundColor: '#999', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: 4, 
                                cursor: 'pointer' 
                              }}
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 작성자 정보와 좋아요/싫어요 버튼 */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '12px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #f0f0f0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '14px', color: '#333' }}>{c.nickname}</strong>
                              <span style={{ fontSize: '12px', color: '#999' }}>•</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button 
                                  onClick={() => handleLikeComment(c, hasLiked ? 'unlike' : 'like')}
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    color: hasLiked ? '#065fd4' : (isPinned ? '#ffd700' : '#666'),
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s',
                                    fontWeight: isPinned ? 'bold' : 'normal'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  {isPinned ? '🏆' : '👍'} {c.likes || 0}
                                </button>
                                <button 
                                  onClick={() => handleLikeComment(c, hasDisliked ? 'undislike' : 'dislike')}
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    color: hasDisliked ? '#d93025' : '#666',
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  👎 {c.dislikes || 0}
                                </button>
                              </div>
                            </div>
                            
                            {/* 編集/削除ボタン (投稿者のみ) */}
                            {isAuthor && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => handleEditComment(c)} 
                                  style={{ 
                                    fontSize: 12, 
                                    color: '#0070f3', 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  ✏️ 編集
                                </button>
                                <button 
                                  onClick={() => handleDeleteComment(c)} 
                                  style={{ 
                                    fontSize: 12, 
                                    color: '#d32f2f', 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  🗑️ 削除
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* 댓글 내용 */}
                          <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
                            {c.content}
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
              
              {/* 더보기 버튼 */}
              {hasMoreComments && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginTop: '24px' 
                }}>
                  <button 
                    onClick={loadMoreComments}
                    style={{ 
                      padding: '12px 24px',
                      fontSize: '14px',
                      backgroundColor: '#f8f9fa',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#ddd';
                    }}
                  >
                    もっと見る ({COMMENTS_PER_PAGE}件)
                  </button>
                </div>
              )}
            </>
          ) : <p>まだコメントがありません。</p>}
        </div>
      </div>
    </>
  );
}
