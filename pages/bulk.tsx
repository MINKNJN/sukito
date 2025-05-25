// /pages/bulk.tsx
import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ImageItem {
  title: string;
  src: string;
}

export default function BulkDownloader() {
  const [input, setInput] = useState('');
  const [list, setList] = useState<ImageItem[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const parseAndSetList = () => {
    try {
      const parsed: ImageItem[] = JSON.parse(input);
      if (parsed.length > 0) setList(parsed);
    } catch (err) {
      console.error('❌ JSON 파싱 실패:', err);
    }
  };

  const startDownloadAsZip = async () => {
    setDownloading(true);
    setProgress(0);
    const zip = new JSZip();
    const folder = zip.folder('cup-noodles');

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      try {
        const res = await fetch(`/api/proxy?url=${encodeURIComponent(item.src)}`);
        const blob = await res.blob();
        folder?.file(`${item.title}.jpg`, blob);
        console.log(`✅ ${item.title} 추가됨`);
      } catch (err) {
        console.warn(`❌ ${item.title} 실패`, err);
      }
      setProgress(Math.round(((i + 1) / list.length) * 100));
      await new Promise(r => setTimeout(r, 300));
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'cup-noodles.zip');
    setDownloading(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '1rem' }}>🥣 ZIP 이미지 다운로드</h1>

      <textarea
        placeholder="콘솔에서 복사한 JSON 배열을 여기에 붙여넣으세요"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={10}
        style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginBottom: '1rem' }}
      />

      <button onClick={parseAndSetList} style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}>
        ✅ 목록 불러오기
      </button>
      <button
        onClick={startDownloadAsZip}
        disabled={list.length === 0 || downloading}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: list.length === 0 ? '#ccc' : '#0070f3',
          color: list.length === 0 ? '#666' : '#fff',
          border: 'none',
          cursor: list.length === 0 ? 'not-allowed' : 'pointer',
          opacity: list.length === 0 ? 0.6 : 1,
        }}
      >
        📦 ZIP으로 저장하기
      </button>

      {downloading && (
        <div style={{ marginTop: '1rem' }}>
          <p>⏳ 압축 중... {progress}% 완료</p>
          <progress value={progress} max={100} style={{ width: '100%' }} />
        </div>
      )}
    </div>
  );
}
