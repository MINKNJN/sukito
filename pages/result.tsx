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
  const { showAlert, showConfirm } = useAlert();

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/result?id=${id}` : '';

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

    fetch(`/api/comments?id=${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.comments) {
          setComments(data.comments);
        }
      });

      const localNickname = getStorageWithExpire('nickname');
      if (localNickname) {
        setNickname(localNickname);
      }
  }, [id]);

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
          content: commentContent.trim()
        })
      });

      if (res.ok) {
        const updatedComments = await fetch(`/api/comments?id=${id}`).then(res => res.json());
        setComments(updatedComments.comments);
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

  const handleReportComment = async (comment: { _id: string }) => {
    showConfirm('このコメントを通報しますか？', () => {
      fetch('/api/comments/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment._id })
      })
      .then(res => {
        if (res.ok) {
          showAlert('通報が受け付けられました。', 'success');
          return fetch(`/api/comments?id=${id}`);
        } else {
          showAlert('通報エラー', 'error');
          throw new Error('通報エラー');
        }
      })
      .then(res => res.json())
      .then(data => {
        setComments(data.comments);
      })
      .catch(err => {
        console.error('エラー:', err);
        showAlert('ネットワークエラー', 'error');
      });
    });
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
        <div style={{ width: '100%', height: 100, border: '2px dashed #ccc', margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GoogleAd />
        </div>

        {winner ? (
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              🏆 {isMyWinner ? 'あなたが選んだ最終優勝者' : '多くの人が選んだ優勝者'}
            </h1>
            <img src={convertToThumbnail(winner.url)} alt={winner.name} style={{maxWidth: '300px', objectFit: 'cover', borderRadius: '12px', border: '4px solid gold', boxShadow: '0 0 12px rgba(255,215,0,0.6)', margin: '0 auto', display: 'block' }} />
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

        <h1>🔥 総合ランキング (Top 10)</h1>
        <input type="text" placeholder="検索" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} style={{ marginBottom: 16, padding: 8, width: '100%', maxWidth: 400 }} />
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
                    <td style={{ padding: 8 }}><img src={convertToThumbnail(item.url)} alt={item.name} width={100} height={150} style={{ objectFit: 'cover' }} /></td>
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
        <div style={{ marginTop: 16 }}>
          <textarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder="コメントを入力してください" rows={4} maxLength={maxCommentLength} style={{ width: '100%', marginBottom: 8 }} />
          <div style={{ textAlign: 'right', fontSize: 12, color: '#666' }}>{commentContent.length} / {maxCommentLength}</div>
          <button onClick={handleCommentSubmit} style={{ marginTop: 8 }}>コメントする</button>

          <div style={{ marginTop: 24 }}>
            {comments.length > 0 ? (
              <ul>
                {comments.map((c, idx) => (
                  <li key={idx} style={{ marginBottom: 10 }}>
                    {c.reportCount >= 3 ? (
                      <div style={{ color: '#999' }}>🚫 このコメントは通報により非表示となっています。</div>
                    ) : (
                      <>
                        <strong>{c.nickname}</strong> : {c.content}<br />
                        <span style={{ fontSize: 12, color: '#999' }}>{new Date(c.createdAt).toLocaleString()}</span>
                        <button onClick={() => handleReportComment(c)} style={{ marginLeft: 10, fontSize: 12, color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>🚩 通報</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p>	まだコメントがありません。</p>}
          </div>
        </div>
      </div>
    </>
  );
}
