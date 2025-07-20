// pages/index.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { getStorageWithExpire } from '@/lib/utils';
import { useAlert } from '@/lib/alert';
import UploadModal from '@/components/UploadModal';
import GoogleAd from '@/components/GoogleAd';


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
  thumbnails?: GameItem[];
};

function getPreviewImage(item: { type: string; url: string }) {
  if (!item) return '';

  if (item.type === 'youtube') {
    const match = item.url.match(/embed\/([^?&"'>]+)/);
    const videoId = match ? match[1] : '';
    return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : '';
  }

  if (item.type === 'video' || item.type === 'gif') {
    return '/default-video-thumbnail.jpg'; 
  }

  return item.url;
}

export default function IndexPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [sortOption, setSortOption] = useState<'popular' | 'latest'>('popular');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'week' | 'day'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  const [resumeData, setResumeData] = useState<any>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useAlert();
  
  useEffect(() => {
    setIsLoading(true); 

    fetch('/api/games')
      .then((res) => res.json())
      .then((data) => setGames(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  
    const stored = localStorage.getItem('sukito_game');
    
    if (stored && stored !== 'undefined') { 
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.gameId) {
          setResumeData(parsed);
          setShowResumeModal(true);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    }
  }, []);
  

  const handleSearch = () => {
    setSearchKeyword(searchInput);
    setVisibleCount(10);
  };

  const handleResumeClick = () => {
    if (resumeData?.gameId) {
      location.href = `/play/${resumeData.gameId}`;
    }
  };

  const handleDeleteResume = () => {
    localStorage.removeItem('sukito_game');
    setResumeData(null);
    setShowResumeModal(false);
    showAlert('削除しました。', 'success');
  };

  const handleDismissModal = () => {
    setShowResumeModal(false);
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
      // 타입 필터링 로직 수정
      if (typeFilter === 'image') {
        // image 타입만 통과
        if (!game.thumbnails || !game.thumbnails.some(item => item.type === 'image')) return false;
      } else if (typeFilter === 'video') {
        // video, gif, youtube 타입이 하나라도 있으면 통과
        if (!game.thumbnails || !game.thumbnails.some(item => item.type === 'video' || item.type === 'gif' || item.type === 'youtube')) return false;
      }
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
      <Head>
        <title>スキト - 好きトーナメント</title>
        <meta name="description" content="画像・GIF・動画から推しを選んでみてください" />
        <meta property="og:title" content="スキト - 好きトーナメント" />
        <meta property="og:description" content="画像・GIF・動画から推しを選んでみてください" />
        <meta property="og:url" content="https://sukito.net" />
        <meta property="og:image" content="https://sukito.net/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="スキト - 好きトーナメント" />
        <meta name="twitter:description" content="画像・GIF・動画から推しを選んでみてください" />
        <meta name="twitter:image" content="https://sukito.net/og-image.jpg" />
      </Head>
      <Header />

      <UploadModal visible={isLoading} message="Loading..." />

      {showResumeModal && resumeData && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>            
          <div style={previewWrapperStyle}>

            {resumeData.items?.[resumeData.matchIndex * 2] && (
            <div style={previewItemStyle}>
              {resumeData.items[resumeData.matchIndex * 2].type === 'video' &&
              resumeData.items[resumeData.matchIndex * 2].url.endsWith('.mp4') ? (
                <video
                  src={resumeData.items[resumeData.matchIndex * 2].url}
                  style={previewImageStyle}
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={getPreviewImage(resumeData.items[resumeData.matchIndex * 2])}
                  style={previewImageStyle}
                  alt="Preview 1"
                />
              )}
            </div>
          )}

            <div style={vsStyle}>VS</div>
            {resumeData.items?.[resumeData.matchIndex * 2 + 1] && (
            <div style={previewItemStyle}>
              {resumeData.items[resumeData.matchIndex * 2 + 1].type === 'video' &&
              resumeData.items[resumeData.matchIndex * 2 + 1].url.endsWith('.mp4') ? (
                <video
                  src={resumeData.items[resumeData.matchIndex * 2 + 1].url}
                  style={previewImageStyle}
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={getPreviewImage(resumeData.items[resumeData.matchIndex * 2 + 1])}
                  style={previewImageStyle}
                  alt="Preview 2"
                />
              )}
            </div>
          )}

          </div>


            <h3 style={{
              fontSize: '1.5rem',
              margin: '16px 0 8px',
              fontWeight: 'bold',
              color: '#333',
            }}>
              {resumeData.gameTitle || 'None'}
            </h3>

            <h4 style={{
              fontSize: '1rem',
              color: '#777',
              marginBottom: 20,
              padding: '0 10px',
            }}>
              {resumeData.gameDesc || 'None'}
            </h4>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button style={resumeButtonStyle} onClick={handleResumeClick}>続きから</button>
              <button style={deleteButtonStyle} onClick={handleDeleteResume}>削除</button>
              <button style={closeButtonStyle} onClick={handleDismissModal}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      <section
        style={{
          backgroundColor: '#fff8dc',
          padding: '24px 16px',
          marginBottom: 24,
          border: '1px solid #ccc',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>スキトとは？</h2>
          <p style={{ fontSize: '1rem', color: '#333' }}>
            好きな画像・動画・GIFを使ってトーナメント形式の人気投票を作成・プレイできる無料のエンタメプラットフォームです。<br />
            誰でも気軽に参加でき、自分の「推し」をみんなと共有して楽しめます。<br />
            ゲームは毎日追加され、アイドル・アニメ・スポーツ・食べ物などジャンルも多彩！ログインなしでも遊べます。
          </p>
      </section>


      <div style={adCardStyle}>
        
        <GoogleAd />

      </div>

      <div style={{ padding: isMobile ? 12 : 24 }}>

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

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setTypeFilter('all'); setVisibleCount(10); }} style={typeFilter === 'all' ? activeButtonStyle : buttonStyle}>すべて</button>
            <button onClick={() => { setTypeFilter('image'); setVisibleCount(10); }} style={typeFilter === 'image' ? activeButtonStyle : buttonStyle}>画像</button>
            <button onClick={() => { setTypeFilter('video'); setVisibleCount(10); }} style={typeFilter === 'video' ? activeButtonStyle : buttonStyle}>動画</button>
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
                    <GameCard id={game._id} title={game.title} desc={game.desc} thumbnailItems={game.thumbnails} />
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
                <GameCard id={game._id} title={game.title} desc={game.desc} thumbnailItems={game.thumbnails} />
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


      <footer style={{
        padding: '32px 16px',
        marginTop: '48px',
        borderTop: '1px solid #ddd',
        textAlign: 'center',
        fontSize: '0.85rem',
        backgroundColor: '#fafafa',
        color: '#666'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <a href="/about" style={footerLinkStyle}>このサイトについて</a>
          <span style={footerDividerStyle}>|</span>
          <a href="/terms" style={footerLinkStyle}>利用規約</a>
          <span style={footerDividerStyle}>|</span>
          <a href="/privacy" style={footerLinkStyle}>プライバシー</a>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
          &copy; 2025 スキト All rights reserved.
        </div>
      </footer>

    </>
  );
}


const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const modalContentStyle: React.CSSProperties = {
  background: 'white',
  padding: '30px 20px',
  borderRadius: 12,
  width: '90%',
  maxWidth: 340,
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
};

const previewWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 10,
};

const previewItemStyle: React.CSSProperties = {
  width: 100,
  height: 140,
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const previewImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const vsStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#333',
};

const resumeButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  backgroundColor: '#00c471',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const deleteButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  backgroundColor: '#f44336',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const closeButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  backgroundColor: '#aaa',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const footerLinkStyle: React.CSSProperties = {
  margin: '0 8px',
  color: '#1565c0',
  textDecoration: 'none',
};

const footerDividerStyle: React.CSSProperties = {
  margin: '0 4px',
  color: '#ccc',
};

const cardSectionStyle: React.CSSProperties = {
  background: '#fff',
  boxShadow: '0 2px 12px #b2ebf222',
  padding: '32px 16px',
  margin: '0 auto 32px auto',
  border: '1.5px solid #e0f7fa',
  borderRadius: '16px',
  textAlign: 'center',
  maxWidth: 700,
};

const adBoxStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 700,
  margin: '0 auto 24px auto',
  height: 100,
  border: '2px dashed #b2ebf2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  background: '#f7fafd',
};

const filterWrapStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: '0 auto',
  padding: '0 8px 24px 8px',
};

const filterRowStyle: React.CSSProperties = {
  marginBottom: 20,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  alignItems: 'center',
  justifyContent: 'center',
};

const cardListWrapStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '0 8px',
};

const adCardStyle: React.CSSProperties = {
  height: 100,
  border: '2px dashed #b2ebf2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  background: '#f7fafd',
  margin: '16px 0',
};

const footerStyle: React.CSSProperties = {
  padding: '32px 16px',
  marginTop: '48px',
  borderTop: '1px solid #b2ebf2',
  textAlign: 'center',
  fontSize: '0.95rem',
  backgroundColor: '#f7fafd',
  color: '#666',
};
