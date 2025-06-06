// pages/play/[id].tsx
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getStorageWithExpire } from '@/lib/utils';

interface GameItem {
  name: string;
  url: string;
  type: 'image' | 'gif' | 'video' | 'youtube';
}

interface Game {
  _id: string;
  title: string;
  desc: string;
  items: GameItem[];
}

interface PlayPageProps {
  game: Game | null;
}

const ROUND_OPTIONS = [2, 4, 8, 16, 32, 64, 128, 256];
const ANIMATION_DURATION = 800;

const optimizeCloudinaryImage = (url: string): string => {
  if (!url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/w_640,f_auto,q_auto,dpr_auto/');
};

// Media.tsx 컴포넌트

const Media: React.FC<{ url: string; type: GameItem['type'] }> = ({ url, type }) => {
  const mediaStyle: React.CSSProperties = {
    maxWidth: '100%',
    height: '100%',
    objectFit: 'contain',      
    display: 'block',
  };

  const wrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#000',
  };

  switch (type) {
    case 'youtube':
      return (
        <div style={wrapperStyle}>
          <iframe src={url} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen
            style={{ width: '100%', height: '100%' }} />
        </div>
      );
    case 'video':
      return (
        <div style={wrapperStyle}>
          <video src={url} autoPlay muted loop playsInline style={mediaStyle} />
        </div>
      );
    case 'gif':
      return (
        <div style={wrapperStyle}>
          <img src={url} alt="gif" style={mediaStyle} />
        </div>
      );
    case 'image':
    default:
      const optimizedUrl = optimizeCloudinaryImage(url);
      return (
        <div style={{
          ...wrapperStyle,
          backgroundImage: `url(${optimizedUrl})`,
          backgroundSize: 'contain', 
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
      );
  }
};


const pickRandomItems = <T,>(arr: T[], count: number): T[] => {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
};

const PlayPage: NextPage<PlayPageProps> = ({ game }) => {
  const router = useRouter();
  const [selectedRound, setSelectedRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [roundItems, setRoundItems] = useState<GameItem[]>([]);
  const [advancing, setAdvancing] = useState<GameItem[]>([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sukito_game');
    if (stored && stored !== 'undefined') {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.gameId === game?._id) {
          setSelectedRound(parsed.round);
          setIsPlaying(true);
          setRoundItems(parsed.items);
          setAdvancing(parsed.advancing || []);
          setMatchIndex(parsed.matchIndex || 0);
        }
      } catch (error) {
        console.error('エラー:', error);
        localStorage.removeItem('sukito_game');
      }
    }
  }, [game]);

  if (!game) return <div style={{ padding: 40 }}>存在しないトーナメントです。</div>;

  const availableRounds = ROUND_OPTIONS.filter(r => r <= game.items.length);

  const totalMatches = Math.floor(roundItems.length / 2);

  const startTournament = () => {
    if (selectedRound === 0) {
      alert('ラウンドを選択してください！');
      return;
    }

    const shuffled = pickRandomItems(game.items, game.items.length);
    const pick =
      selectedRound === -1
        ? shuffled
        : shuffled.slice(0, selectedRound); // 기존과 동일

    const saveState = {
      gameId: game._id,
      gameTitle: game.title,
      gameDesc: game.desc,
      round: Math.ceil(pick.length / 2),
      items: pick,
      advancing: [],
      matchIndex: 0,
    };

    localStorage.setItem('sukito_game', JSON.stringify(saveState));
    setRoundItems(pick);
    setAdvancing([]);
    setMatchIndex(0);
    setSelectedSide(null);
    setIsPlaying(true);
  };


  const handleSelect = (side: 'left' | 'right') => {
    if (isAnimating) return;
    setSelectedSide(side);
    setIsAnimating(true);

    const winner = side === 'left' ? roundItems[matchIndex * 2] : roundItems[matchIndex * 2 + 1];
    const newAdvancing = [...advancing, winner];

    setTimeout(() => {
      const isLastMatch = matchIndex + 1 >= totalMatches;

      if (isLastMatch) {
        if (roundItems.length % 2 !== 0) {
          const byeItem = roundItems[roundItems.length - 1];
          if (!newAdvancing.includes(byeItem)) {
            newAdvancing.push(byeItem);
          }
        }
        if (newAdvancing.length === 1) {
          try {
            fetch('/api/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameId: game._id,
                winnerName: winner.name,
                winnerUrl: winner.url,
              }),
            });
            localStorage.setItem(`sukito_winner_${game._id}`, JSON.stringify(winner));
          } catch (e) {
            console.error('エラー:', e);
          }
          localStorage.removeItem('sukito_game');
          router.push(`/result?id=${game._id}`);
          return;
        } else {
          const nextRoundItems = [...newAdvancing];
          localStorage.setItem('sukito_game', JSON.stringify({
            gameId: game._id,
            gameTitle: game.title,
            gameDesc: game.desc,
            round: nextRoundItems.length / 2,
            items: nextRoundItems,
            advancing: [],
            matchIndex: 0,
          }));
          location.reload();
          return;
        }
      }

      localStorage.setItem('sukito_game', JSON.stringify({
        gameId: game._id,
        gameTitle: game.title,
        gameDesc: game.desc,
        round: roundItems.length / 2,
        items: roundItems,
        advancing: newAdvancing,
        matchIndex: matchIndex + 1,
      }));
      location.reload();
    }, ANIMATION_DURATION);
  };

  if (!isPlaying) {
    return (
      <div className="container">
        <h1 className="title">{game.title}</h1>
        <p>{game.desc}</p>
        <div className="selector">
          <label>ラウンドを選択してください！</label>
          <select value={selectedRound} onChange={e => setSelectedRound(+e.target.value)}>
            <option value={0}>-- 選択 --</option>
            {availableRounds.map(r => (
              <option key={r} value={r}>ベスト{r}</option>
            ))}
            <option value={-1}>すべての候補でトーナメントを始める</option>
          </select>

          <p>
            {selectedRound === -1
              ? `全 ${game.items.length}人の候補がすべて対戦します。`
              : `全 ${game.items.length}人の候補からランダムに ${selectedRound}人が対戦します。`}
          </p>

          <button onClick={startTournament}>スタート</button>
        </div>
        <style jsx>{`
          .container { max-width: 600px; margin: auto; padding: 2rem; text-align: center; }
          select { padding: 0.5rem; margin: 1rem; font-size: 1rem; }
          button { padding: 0.75rem 1.5rem; font-size: 1rem; background: #00c471; color: white; border: none; border-radius: 6px; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  const left = roundItems[matchIndex * 2];
  const right = roundItems[matchIndex * 2 + 1];
  if (!left || !right) return null;

  const isLeftExpanded = selectedSide === 'left';
  const isRightExpanded = selectedSide === 'right';

  return (
    <>
      <Head>
        <title>{`${game.title} - ${left?.name || ''} vs ${right?.name || ''} | sukito | スキト - 好きトーナメント`}</title>
        <meta name="description" content={`${left?.name} vs ${right?.name} ベスト·オブ·ベスト`} />
  
        {/* Open Graph */}
        <meta property="og:title" content={`${game.title} - ${left?.name} vs ${right?.name}`} />
        <meta property="og:description" content={`あなたの理想のタイプは誰？ ${left?.name} vs ${right?.name}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://sukito.net/play/${game._id}`} />
        <meta property="og:image" content={left?.url || '/og-image.jpg'} />
  
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${game.title} - ${left?.name} vs ${right?.name}`} />
        <meta name="twitter:description" content={`スキト - 好きトーナメント ${left?.name} vs ${right?.name}`} />
        <meta name="twitter:image" content={left?.url || '/og-image.jpg'} />
      </Head>


      <div className="battle" style={{ backgroundColor: 'black', flexDirection: 'column' }}>
        <div style={{ width: '100%', height: 100, border: '2px dashed #ccc', margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          好きトーナメント
        </div>

        <div className="info-bar">
          <h2 style={{ color: 'white', textAlign: 'center', padding: '0.5rem 0' }}>{game.title} ベスト{roundItems.length} {matchIndex + 1}/{totalMatches}</h2>
        </div>

        <div style={{ display: 'flex', flex: 1, width: '100%' }}>
          <div className={`media-wrapper ${isLeftExpanded ? 'expanded' : selectedSide === 'right' ? 'collapsed' : ''}`} onClick={() => left.type === 'youtube' ? null : handleSelect('left')}>
            <Media url={left.url} type={left.type} />
            <div className="overlay name">{left.name}</div>
            {(left.type === 'youtube') && <button className="select-button left" onClick={() => handleSelect('left')}>✔ 選択</button>}
          </div>

          <div className={`media-wrapper ${isRightExpanded ? 'expanded' : selectedSide === 'left' ? 'collapsed' : ''}`} onClick={() => right.type === 'youtube' ? null : handleSelect('right')}>
            <Media url={right.url} type={right.type} />
            <div className="overlay name">{right.name}</div>
            {(right.type === 'youtube') && <button className="select-button right" onClick={() => handleSelect('right')}>✔ 選択</button>}
          </div>
        </div>

        <style jsx>{`
          .battle { display: flex; width: 100vw; height: 100vh; overflow: hidden; }
          .media-wrapper { flex: 1; height: 90%; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; transition: all ${ANIMATION_DURATION}ms ease; }
          .media-wrapper.expanded { flex: 1 0 100%; opacity: 1; }
          .media-wrapper.collapsed { flex: 0 0 0%; opacity: 0; transform: scale(0); }
          .overlay.name { position: absolute; bottom: 14%; width: 100%; text-align: center; font-size: 2rem; color: white; text-shadow: 0 0 4px black, 0 0 8px black, 0 0 12px black; pointer-events: none; }
          .select-button { position: absolute; bottom: 2%; left: 50%; transform: translateX(-50%); padding: 1rem 2rem; font-size: 1.5rem; border: none; border-radius: 8px; cursor: pointer; color: white; }
          .select-button.left { background-color: #d94350; }
          .select-button.right { background-color: #0070f3; }
          @media (max-width: 768px) {
            .media-wrapper { height: 35vh; }
            .overlay.name { font-size: 1.2rem; }
            .select-button { font-size: 1rem; padding: 0.5rem 1.0rem; }
          }
        `}</style>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const { id } = ctx.params as { id: string };
    const client = await clientPromise;
    const db = client.db('sukito');
    const game = await db.collection('games').findOne({ _id: new ObjectId(id) });

    if (!game) return { props: { game: null } };

    return {
      props: {
        game: {
          ...game,
          _id: game._id.toString(),
          items: game.items.map((item: any) => ({
            name: item.name,
            url: item.url,
            type: item.type || 'image',
          })),
        },
      },
    };
  } catch {
    return { props: { game: null } };
  }
};

export default PlayPage;