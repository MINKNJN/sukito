// pages/index.tsx
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { useAlert } from '@/lib/alert';
import GoogleAd from '@/components/GoogleAd';
import clientPromise from '@/lib/mongodb';


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
  thumbnails?: GameItem[];
  playCount?: number;
};

function getPreviewImage(item: { type: string; url: string }) {
  if (!item) return '';

  if (item.type === 'youtube') {
    const match = item.url.match(/embed\/([^?&"'>]+)/);
    const videoId = match ? match[1] : '';
    return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : '';
  }

  if (item.type === 'gif') {
    return '/default-video-thumbnail.jpg'; 
  }

  return item.url;
}

type IndexPageProps = {
  initialGames: Game[];
};

export default function IndexPage({ initialGames }: IndexPageProps) {
  const [games] = useState<Game[]>(initialGames);
  const [isDescOpen, setIsDescOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'popular' | 'latest'>('popular');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'youtube'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [visibleCount, setVisibleCount] = useState(99);

  const [resumeData, setResumeData] = useState<any>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [isResumeLoading, setIsResumeLoading] = useState(false);

  const { showAlert } = useAlert();

  // 이어하기 데이터 확인 (마운트 시 실행)
  useEffect(() => {
    const stored = localStorage.getItem('sukito_game');
    if (stored && stored !== 'undefined') {
      try {
        const parsed = JSON.parse(stored || '{}');
        if (parsed && parsed.gameId) {
          setResumeData(parsed);
          setShowResumeModal(true);
        }
      } catch (err) {
        // 파싱 오류 무시
      }
    }
  }, []);
  

  const handleSearch = () => {
    setSearchKeyword(searchInput);
    setVisibleCount(10);
  };

  const handleResumeClick = async () => {
    if (resumeData?.gameId) {
      setIsResumeLoading(true);
      try {
        // 게임 존재 여부 확인
        const response = await fetch(`/api/games/${resumeData.gameId}`);
        if (response.ok) {
          // 게임이 존재하면 게임 페이지로 이동
          location.href = `/play/${resumeData.gameId}`;
        } else {
          // 게임이 존재하지 않으면 저장된 데이터 삭제하고 에러 메시지 표시
          localStorage.removeItem('sukito_game');
          setResumeData(null);
          setShowResumeModal(false);
          showAlert('存在しないゲームです。', 'error');
        }
      } catch (error) {
        // 네트워크 오류 시에도 저장된 데이터 삭제
        localStorage.removeItem('sukito_game');
        setResumeData(null);
        setShowResumeModal(false);
        showAlert('存在しないゲームです。', 'error');
      } finally {
        setIsResumeLoading(false);
      }
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

  const filteredGames = games
    .filter((game) => {
      // タイプフィルタリングロジック修正
      if (typeFilter === 'image') {
        // image 타입만 통과
        if (!game.thumbnails || !game.thumbnails.some(item => item.type === 'image')) return false;
      } else if (typeFilter === 'youtube') {
        // youtube 타입이 하나라도 있으면 통과
        if (!game.thumbnails || !game.thumbnails.some(item => item.type === 'youtube')) return false;
      }
      if (searchKeyword && !(
        game.title.includes(searchKeyword) ||
        game.desc.includes(searchKeyword) 
      )) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'popular') return (b.playCount ?? 0) - (a.playCount ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const buttonStyle: React.CSSProperties = {
    background: '#f7fafd',
    border: '1.5px solid #b2ebf2',
    padding: '7px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#4caf50',
    fontWeight: 600,
    boxShadow: '0 1px 4px #b2ebf222',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  };
  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#4caf50',
    color: '#fff',
    borderColor: '#4caf50',
    boxShadow: '0 2px 8px #4caf5022',
  };
  const inputStyle: React.CSSProperties = {
    padding: '7px 10px',
    border: '1.5px solid #b2ebf2',
    borderRadius: 8,
    fontSize: '0.9rem',
    background: '#f7fafd',
    color: '#222',
    outline: 'none',
    minWidth: 0,
  };
  const moreButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    fontSize: '1rem',
    borderRadius: 10,
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px #4caf5022',
    marginTop: 0,
  };


  return (
    <>
      <Head>
        <title>スキト - 好きトーナメント | 無料投票ゲーム作成・共有プラットフォーム</title>
        <meta name="description" content="画像・GIF・動画・YouTubeを使ってトーナメント形式の投票ゲームを作成・共有できる無料のエンタメプラットフォーム。アニメ、アイドル、スポーツなど様々なジャンルの推し投票を楽しめます。" />
        <meta name="keywords" content="投票,トーナメント,ゲーム,エンタメ,アニメ,アイドル,スポーツ,推し,人気投票,無料ゲーム,画像投票,動画投票,GIF投票,YouTube投票,スキト,好きトーナメント" />
        <meta name="author" content="Sukito" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="language" content="ja" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#4caf50" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Open Graph */}
        <meta property="og:title" content="スキト - 好きトーナメント | 無料投票ゲーム作成・共有プラットフォーム" />
        <meta property="og:description" content="画像・GIF・動画・YouTubeを使ってトーナメント形式の投票ゲームを作成・共有できる無料のエンタメプラットフォーム。アニメ、アイドル、スポーツなど様々なジャンルの推し投票を楽しめます。" />
        <meta property="og:url" content="https://sukito.net" />
        <meta property="og:image" content="https://sukito.net/og-image.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="スキト" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="スキト - 好きトーナメント | 無料投票ゲーム作成・共有プラットフォーム" />
        <meta name="twitter:description" content="画像・GIF・動画・YouTubeを使ってトーナメント形式の投票ゲームを作成・共有できる無料のエンタメプラットフォーム。" />
        <meta name="twitter:image" content="https://sukito.net/og-image.jpg" />
        <meta name="twitter:site" content="@sukito_net" />
        <meta name="twitter:creator" content="@sukito_net" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://sukito.net" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/trophy.svg" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "スキト - 好きトーナメント",
              "alternateName": "Sukito",
              "description": "画像・GIF・動画・YouTubeを使ってトーナメント形式の投票ゲームを作成・共有できる無料のエンタメプラットフォーム",
              "url": "https://sukito.net",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://sukito.net?search={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "sameAs": [
                "https://twitter.com/sukito_net"
              ],
              "publisher": {
                "@type": "Organization",
                "name": "スキト",
                "url": "https://sukito.net"
              },
              "inLanguage": "ja-JP",
              "isAccessibleForFree": true
            })
          }}
        />
      </Head>
      <Header />


      {showResumeModal && resumeData && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>            
          <div style={previewWrapperStyle}>

            {resumeData.items?.[resumeData.matchIndex * 2] && (
            <div style={previewItemStyle}>
              {resumeData.items[resumeData.matchIndex * 2].type === 'gif' &&
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
              {resumeData.items[resumeData.matchIndex * 2 + 1].type === 'gif' &&
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
              <button 
                style={isResumeLoading ? resumeButtonDisabledStyle : resumeButtonStyle} 
                onClick={handleResumeClick}
                disabled={isResumeLoading}
              >
                {isResumeLoading ? '確認中...' : '続きから'}
              </button>
              <button 
                style={deleteButtonStyle} 
                onClick={handleDeleteResume}
                disabled={isResumeLoading}
              >
                削除
              </button>
              <button 
                style={closeButtonStyle} 
                onClick={handleDismissModal}
                disabled={isResumeLoading}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        style={{
          backgroundColor: '#fff8dc',
          padding: '8px',
          marginBottom: 12,
          border: '1px solid #ccc',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <h1 style={{ fontSize: '1.3rem', margin: 0 }}>スキト - 好きトーナメント</h1>
          <button
            onClick={() => setIsDescOpen((v) => !v)}
            style={{
              background: 'none',
              border: '1px solid #aaa',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            {isDescOpen ? '閉じる' : '詳細'}
          </button>
        </div>
        {isDescOpen && (
          <>
            <p style={{ fontSize: '1rem', color: '#333', marginTop: 12 }}>
              好きな画像・動画・GIFを使ってトーナメント形式の人気投票を作成・プレイできる無料のエンタメプラットフォームです。<br />
              誰でも気軽に参加でき、自分の「推し」をみんなと共有して楽しめます。<br />
              ゲームは毎日追加され、アイドル・アニメ・スポーツ・食べ物などジャンルも多彩！ログインなしでも遊べます。
            </p>
            <div style={{ marginTop: '12px' }}>
              <a
                href="/guide"
                style={{
                  color: '#4caf50',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  padding: '8px 16px',
                  border: '2px solid #4caf50',
                  borderRadius: '6px',
                  display: 'inline-block',
                }}
              >
                詳しい使い方を見る
              </a>
            </div>
          </>
        )}
      </section>


      {/* 광고를 콘텐츠 섹션으로 감싸기 */}
      <section style={{
        backgroundColor: '#f8f9fa',
        padding: '10px',
        marginBottom: 12,
        borderRadius: '8px',
        border: '1px solid #e9ecef',
      }}>
        <div style={{
          height: 100,
          border: '2px dashed #b2ebf2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          background: '#f7fafd',
        }}>
          <GoogleAd
            adSlot="4782225618"
            adFormat="auto"
            fullWidthResponsive={true}
            style={{ minHeight: 100 }}
          />
        </div>
      </section>

      <div style={{ padding: 10 }}>

        <div className="row g-2" style={{ marginBottom: 16 }}>
          {/* 필터 버튼 — 웹 50% / 모바일 100% */}
          <div className="col-12 col-md-6" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <button onClick={() => { setSortOption('popular'); setVisibleCount(10); }} style={sortOption === 'popular' ? activeButtonStyle : buttonStyle}>人気順</button>
            <button onClick={() => { setSortOption('latest'); setVisibleCount(10); }} style={sortOption === 'latest' ? activeButtonStyle : buttonStyle}>新着順</button>
            <span style={{ alignSelf: 'stretch', borderLeft: '1px solid #ddd', margin: '0 2px' }} />
            <button onClick={() => { setTypeFilter('all'); setVisibleCount(10); }} style={typeFilter === 'all' ? activeButtonStyle : buttonStyle}>すべて</button>
            <button onClick={() => { setTypeFilter('image'); setVisibleCount(10); }} style={typeFilter === 'image' ? activeButtonStyle : buttonStyle}>画像</button>
            <button onClick={() => { setTypeFilter('youtube'); setVisibleCount(10); }} style={typeFilter === 'youtube' ? activeButtonStyle : buttonStyle}>動画</button>
          </div>
          {/* 검색 — 웹 50% / 모바일 100% */}
          <div className="col-12 col-md-6" style={{ display: 'flex', gap: 4 }}>
            <input type="text" placeholder="ゲーム検索" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ ...inputStyle, flex: 1 }} />
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
                    <div style={{ 
                      height: '95%', 
                      border: '2px dashed #ccc', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      <div style={{ textAlign: 'center', padding: '8px' }}>
                        <GoogleAd
                          adSlot="4782225618"
                          adFormat="auto"
                          fullWidthResponsive={true}
                          style={{ minHeight: 90 }}
                        />
                      </div>
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
  transition: 'all 0.2s',
};

const resumeButtonDisabledStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  backgroundColor: '#ccc',
  color: '#666',
  border: 'none',
  borderRadius: 6,
  cursor: 'not-allowed',
  transition: 'all 0.2s',
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

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const games = await db.collection('games').find(
      {},
      {
        projection: {
          title: 1,
          desc: 1,
          thumbnails: 1,
          createdAt: 1,
          createdBy: 1,
        },
      }
    ).sort({ createdAt: -1 }).toArray();

    const recordsCollection = db.collection('records');
    const gamesWithPlayCount = await Promise.all(
      games.map(async (game) => {
        const playCount = await recordsCollection.countDocuments({ gameId: game._id.toString() });
        return {
          _id: game._id.toString(),
          title: game.title ?? '',
          desc: game.desc ?? '',
          thumbnails: game.thumbnails ?? [],
          createdAt: game.createdAt ? new Date(game.createdAt).toISOString() : new Date().toISOString(),
          playCount,
        };
      })
    );

    return { props: { initialGames: gamesWithPlayCount } };
  } catch {
    return { props: { initialGames: [] } };
  }
};
