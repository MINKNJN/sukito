// /lib/utils.ts

export function convertToThumbnail(url: string): string {
  if (url.includes('res.cloudinary.com')) {
    if (url.match(/\.(gif)$/i)) {
      return url.replace('/upload/', '/upload/pg_1/').replace('.gif', '.jpg');
    }
    if (url.match(/\.(mp4)$/i)) {
      return url.replace('/upload/', '/upload/pg_1/').replace('.mp4', '.jpg');
    }
    return url; 
  }

  if (url.includes('youtube.com/embed')) {
    const match = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  }

  // S3/CloudFront URL
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  return '/no-image.png';
}

export function getStorageWithExpire(key: string) {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  if (key === 'token') return stored;

  try {
    if (!stored.startsWith('{')) return null;
    const parsed = JSON.parse(stored);
    if (Date.now() > parsed.expire) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

// ✅ getThumbnailUrl
export function getThumbnailUrl(item: { type: string; url: string }): string {
  if (!item || !item.url || !item.type) return '/placeholder-thumbnail.png';

  if (item.type === 'youtube') {
    const match = item.url.match(/embed\/([^?&"'>]+)/);
    const videoId = match ? match[1] : '';
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '/placeholder-thumbnail.png';
  }

  if (item.type === 'gif' || item.type === 'image') {
    // 모든 타입에서 url을 그대로 사용 (GIF도 mp4 URL 사용)
    return item.url;
  }

  return item.url;
}
