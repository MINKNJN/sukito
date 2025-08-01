// components/GameCard.tsx
import { useEffect, useState } from 'react';
import { convertToThumbnail } from '@/lib/utils';
import { useAlert } from '@/lib/alert';

const YoutubeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="#FF0000"
  >
    <path d="M23.498 6.186a2.892 2.892 0 0 0-2.034-2.044C19.596 3.5 12 3.5 12 3.5s-7.596 0-9.464.642a2.892 2.892 0 0 0-2.034 2.044A30.196 30.196 0 0 0 0 12a30.196 30.196 0 0 0 .502 5.814 2.892 2.892 0 0 0 2.034 2.044C4.404 20.5 12 20.5 12 20.5s7.596 0 9.464-.642a2.892 2.892 0 0 0 2.034-2.044A30.196 30.196 0 0 0 24 12a30.196 30.196 0 0 0-.502-5.814ZM9.75 15.02V8.98l6.27 3.02-6.27 3.02Z" />
  </svg>
);

interface GameItem {
  url: string;
  name: string;
  type: 'image' | 'gif' | 'youtube';
}

interface GameCardProps {
  id: string;
  title: string;
  desc: string;
  thumbnailItems?: GameItem[];
  adminButtons?: React.ReactNode;
}

export default function GameCard({ id, title, desc, thumbnailItems, adminButtons }: GameCardProps) {
  const [windowWidth, setWindowWidth] = useState(1200);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [validThumb, setValidThumb] = useState<boolean[]>([]);
  const { showAlert } = useAlert();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const targets = (thumbnailItems ?? []).slice(0, 2);
    const checks = targets.map((item) => {
      if (item.type === 'youtube') {
        const match = item.url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
        const videoId = match?.[1];
        if (!videoId) return Promise.resolve(false);
        return new Promise<boolean>((resolve) => {
          const img = new Image();
          img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      }
      return Promise.resolve(true);
    });

    Promise.all(checks).then((results) => setValidThumb(results));
  }, [thumbnailItems]);

  const shareUrl = `${window.location.origin}/play/${id}`;

  const handleShareToggle = () => {
    setIsShareOpen(!isShareOpen);
  };

  const shareToTwitter = () => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent('好きトーナメント');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToLine = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showAlert('コピーOK', 'success');
    } catch {
      showAlert('ERROR', 'error');
    }
  };

  return (
    <div className="game-card" style={cardWrapperStyle}>
      <div className="game-card__thumbnails" style={previewWrapperStyle}>
        {((thumbnailItems && thumbnailItems.length > 0) ? thumbnailItems.slice(0, 2) : [null, null]).map((item, index) => {
          if (!item) {
            // 기본 썸네일
            return (
              <div key={index} className="game-card__thumbnail" style={previewItemStyle}>
                <div
                  className="game-card__thumbnail-image"
                  style={{
                    ...previewImageStyle,
                    backgroundImage: `url(/placeholder-thumbnail.png)`,
                    position: 'relative',
                  }}
                />
                <div className="game-card__thumbnail-name" style={previewNameStyle}></div>
              </div>
            );
          }
          const isYoutube = item.url.includes('youtube.com/embed');
          const isVideo = item.type === 'gif';
          const isImage = item.type === 'image';

          const badge =
            isYoutube
              ? null
                              : item.type === 'gif'
                  ? { text: 'GIF', bg: '#00c49a' }
                  : isImage
                    ? { text: 'IMG', bg: '#0070f3' }
                    : null;

          return (
            <div key={item.url} className="game-card__thumbnail" style={previewItemStyle}>
              {isVideo ? (
                <div
                  className="game-card__thumbnail-image"
                  style={{
                    ...previewImageStyle,
                    position: 'relative',
                    background: '#000',
                    padding: 0,
                  }}
                >
                  <video
                    src={item.url}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      aspectRatio: '1/1.7',
                      borderRadius: 6,
                      display: 'block',
                    }}
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                  {(index === 1 && badge) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        backgroundColor: badge.bg,
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        padding: '6px 2px',
                        borderRadius: 4,
                        lineHeight: 1,
                      }}
                    >
                      {badge.text}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="game-card__thumbnail-image"
                  style={{
                    ...previewImageStyle,
                    backgroundImage: `url(${validThumb[index] ? convertToThumbnail(item.url) : '/placeholder-thumbnail.png'})`,
                    position: 'relative',
                  }}
                >
                  {(index === 1 && isYoutube) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        borderRadius: 4,
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <YoutubeIcon />
                    </div>
                  )}
                  {(index === 1 && badge) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        backgroundColor: badge.bg,
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        padding: '6px 2px',
                        borderRadius: 4,
                        lineHeight: 1,
                      }}
                    >
                      {badge.text}
                    </div>
                  )}
                </div>
              )}
              <div className="game-card__thumbnail-name" style={previewNameStyle}>{item.name}</div>
            </div>
          );
        })}
      </div>

        <div style={{ marginTop: 8 }}>
          <h3 className="game-card__title" style={titleStyle}>{title}</h3>
          <p className="game-card__desc" style={descStyle}>{desc}</p>
        </div>

        <div className="game-card__buttons" style={buttonGroupStyle}>
          <button onClick={() => window.open(`/play/${id}`, '_blank')} style={{ ...buttonStyle, ...startButtonStyle }}>スタート</button>
          <button onClick={() => location.href = `/result?id=${id}`} style={{ ...buttonStyle, ...rankButtonStyle }}>ランキング</button>
          <button onClick={handleShareToggle} style={{ ...buttonStyle, ...shareButtonStyle }}>シェア</button>
          {adminButtons && adminButtons}
        </div>

        {isShareOpen && (
          <div className="game-card__share-menu" style={shareMenuStyle}>
            <button onClick={shareToTwitter} style={{ ...shareMenuButtonStyle, backgroundColor: '#1DA1F2' }}>X</button>
            <button onClick={shareToFacebook} style={{ ...shareMenuButtonStyle, backgroundColor: '#1877F2' }}>FaceBook</button>
            <button onClick={shareToLine} style={{ ...shareMenuButtonStyle, backgroundColor: '#00C300' }}>LINE</button>
            <button onClick={copyLink} style={{ ...shareMenuButtonStyle, backgroundColor: '#999' }}>リンクコピー</button>
          </div>
        )}
      </div>
  );
}


const cardWrapperStyle: React.CSSProperties = {
  minWidth: 0,
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 10,
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  transition: 'box-shadow 0.3s',
  marginBottom: 12,
};

const previewWrapperStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  minWidth: 0,
};

const previewItemStyle: React.CSSProperties = {
  flex: '1 1 0%',
  textAlign: 'center',
  minWidth: 0,
};

const previewImageStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '1/1.7',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: '#f0f0f0',
  borderRadius: 6,
  overflow: 'hidden',
};

const previewNameStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: '0.8rem',
  fontWeight: 500,
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};


const titleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 'bold',
  margin: '0 0 4px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};


const descStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#555',
  margin: 0,
  display: '-webkit-box',
  WebkitLineClamp: 10,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};


const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 12,
  gap: 2,
  minWidth: 0,
  flexWrap: 'wrap',
};

const buttonStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: 4,
  padding: '2px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const startButtonStyle: React.CSSProperties = {
  backgroundColor: '#ffdddd',
  borderColor: '#ff4d4d',
  color: '#cc0000',
};

const rankButtonStyle: React.CSSProperties = {
  backgroundColor: '#ddffdd',
  borderColor: '#4caf50',
  color: '#2e7d32',
};

const shareButtonStyle: React.CSSProperties = {
  backgroundColor: '#ddeeff',
  borderColor: '#42a5f5',
  color: '#1565c0',
};

const shareMenuStyle: React.CSSProperties = {
  marginTop: 8,
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const shareMenuButtonStyle: React.CSSProperties = {
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: '0.8rem',
  cursor: 'pointer',
};

