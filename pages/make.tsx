// /pages/make.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import UploadModal from '@/components/UploadModal';
import imageCompression from 'browser-image-compression';


const visibilityOptions = ['public', 'private', 'password'] as const;
type Visibility = typeof visibilityOptions[number];
const tabOptions = ['image', 'gif', 'video'] as const;
type TabType = typeof tabOptions[number];

interface VideoRow {
  url: string;
  name: string;
  stime: string;
  etime: string;
  valid: boolean;
}

export default function MakePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { id } = router.query;

  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('image');

  const [files, setFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [videoRows, setVideoRows] = useState<VideoRow[]>([{
    url: '', name: '', stime: '', etime: '', valid: true
  }]);
  const [userId, setUserId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [itemsHistory, setItemsHistory] = useState<any[]>([]);


  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('ログインしてください。');
        router.push('/login');
        return;
      }
      try {
        const res = await fetch('/api/jwt', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const userId = data.user?.userId || data.userId;
          if (!userId) {
            throw new Error('ERROR');
          }
          setUserId(userId);
        } else {
          alert('確認に失敗');
          router.push('/login');
        }
      } catch (err) {
        console.error('確認に失敗:', err);
        alert('確認に失敗');
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      setIsEditMode(true);
      fetch(`/api/games?id=${id}`)
        .then(res => res.json())
        .then((data) => {
          if (!data || !data.items) return;
          setTitle(data.title);
          setDesc(data.desc);
          setVisibility(data.visibility);
          setPassword(data.password || '');
          setActiveTab(data.type);
          setItemsHistory(data.itemsHistory || []); 

          if (data.type === 'video') {
            const videos = data.items.map((i: any) => {
              const match = i.url.match(/start=(\d+)&end=(\d+)/);
              return {
                url: i.url,
                name: i.name,
                stime: match?.[1] || '',
                etime: match?.[2] || '',
                valid: true
              };
            });
            setVideoRows(videos);
          } else {
            setUploadedUrls(data.items.map((i: any) => i.url));
            setFileNames(data.items.map((i: any) => i.name));
          }
        });
    }
  }, [id]);

  const mergeItemsHistory = (original: any[], updates: any[]) => {
    const key = (item: any) => `${item.url}-${item.type}`;
    const map = new Map<string, any>();
    original.forEach(item => map.set(key(item), item));
    updates.forEach(item => map.set(key(item), item));
    return Array.from(map.values());
  };
  

  const handleTabChange = (tab: TabType) => {
    if (isEditMode && tab !== activeTab) {
      alert('編集中はデータの種類を変更できません。');
      return;
    }
    if (!isEditMode && !confirm('タブを変更すると入力内容がリセットされます。\n続行してもよろしいですか？')) return;
    setActiveTab(tab);
    clearFiles();
    setVideoRows([{ url: '', name: '', stime: '', etime: '', valid: true }]);
  };

  const MAX_FILE_SIZE_MB = 10;

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = Array.from(e.target.files || []);

  const filtered = selectedFiles.filter(file => {
    const isValidSize = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;

    const isValidType =
      (activeTab === 'image' && /\.(jpe?g|png)$/i.test(file.name)) ||
      (activeTab === 'gif' && /\.gif$/i.test(file.name));

    if (!isValidSize) {
      alert(`「${file.name}」は${MAX_FILE_SIZE_MB}MB以下のみアップロード可能です。`);
    }
    return isValidSize && isValidType;
  });

  setFiles(prev => [...prev, ...filtered]);
  setFileNames(prev => [
    ...prev,
    ...filtered.map(f => f.name.replace(/\.(jpe?g|png|gif)$/i, '')),
  ]);
};


  const clearFiles = () => {
    setFiles([]);
    setFileNames([]);
    setUploadedUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileNameChange = (index: number, value: string) => {
    const updated = [...fileNames];
    updated[index] = value;
    setFileNames(updated);
  };

  const handleRemoveFile = (index: number) => {
    const isNew = index >= uploadedUrls.length;
    if (isNew) {
      const relativeIndex = index - uploadedUrls.length;
      const newFiles = [...files];
      const newNames = [...fileNames];
      newFiles.splice(relativeIndex, 1);
      newNames.splice(index, 1);
      setFiles(newFiles);
      setFileNames(newNames);
    } else {
      const newUrls = [...uploadedUrls];
      const newNames = [...fileNames];
      newUrls.splice(index, 1);
      newNames.splice(index, 1);
      setUploadedUrls(newUrls);
      setFileNames(newNames);
    }
  };

  const extractVideoId = (url: string): string | null => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regex = /(?:v=|\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
      } else {
        return /^[a-zA-Z0-9_-]{11}$/.test(url) ? url : null;
      }
    } catch {
      return null;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.includes('\t')) return;
    e.preventDefault();
    const lines = pastedText.trim().split('\n');
    const newRows = lines.map((line) => {
      const [url, name, stime, etime] = line.split('\t');
      return { url: url?.trim() || '', name: name?.trim() || '', stime: stime?.trim() || '', etime: etime?.trim() || '', valid: true };
    }).filter(row => row.url);
    const updatedRows = [...videoRows];
    updatedRows.splice(index, 1, ...newRows);
    setVideoRows(updatedRows);
  };

  const handleSubmit = async () => {
    setIsUploading(true); 
    let items: { name: string; url: string; type: 'image' | 'gif' | 'video' | 'youtube' }[] = [];
    let newUploadedUrls: string[] = [];
  
    try {
      if (activeTab === 'image') {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          });
      
          const formData = new FormData();
          formData.append('file', compressedFile);
          formData.append('upload_preset', 'sukito_preset');
      
          const res = await fetch('https://api.cloudinary.com/v1_1/dpow8xm10/image/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          newUploadedUrls.push(data.secure_url);
        }
      
        const allUrls = [...uploadedUrls, ...newUploadedUrls];
        items = fileNames.map((name, i) => ({
          name,
          url: allUrls[i],
          type: 'image',
        }));
      }
      
      if (activeTab === 'gif') {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file); 
      
          try {
            const res = await fetch('/api/upload-gif', {
              method: 'POST',
              body: formData,
            });
      
            if (!res.ok) {
              const errorText = await res.text();
              console.error('❌ GIF :', errorText);
              alert('GIF エラー');
              continue;
            }
      
            const data = await res.json();
      
            if (!data.secure_url) {
              console.warn('⚠️ secure_url :', data);
              alert('URL エラー');
              continue;
            }
      
            newUploadedUrls.push(data.secure_url);
          } catch (error) {
            console.error('❌ server:', error);
            alert('server エラー');
            continue;
          }
        }
      
        const allUrls = [...uploadedUrls, ...newUploadedUrls];
      
        items = fileNames.map((name, i) => ({
          name,
          url: allUrls[i],
          type: 'video', 
        }));
      }
      
      

  
      if (activeTab === 'video') {
        items = videoRows.map((row) => {
          const videoId = extractVideoId(row.url);
          const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?start=${row.stime}&end=${row.etime}` : '';
          return { name: row.name, url: embedUrl, type: 'youtube' };
        });
      }
  
      const finalItemsHistory = mergeItemsHistory(itemsHistory, items);
  
      const payload = {
        title,
        desc,
        visibility,
        password: visibility === 'password' ? password : '',
        type: activeTab,
        items,
        itemsHistory: finalItemsHistory,
        createdBy: userId,
        [isEditMode ? 'updatedAt' : 'createdAt']: new Date().toISOString(),
      };
  
      const res = await fetch(isEditMode ? `/api/games?id=${id}` : '/api/games', {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const result = await res.json();
      if (res.ok) {
        alert(isEditMode ? '編集完了!' : '登録完了!');
        router.push(`/play/${isEditMode ? id : result.id}`);
      } else {
        alert(result.message || 'リクエスト失敗');
      }
    } catch (err) {
      console.error('リクエスト失敗:', err);
      alert('ネットワークエラー');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Header />
      <div style={{ padding: 24 }}>
        <h1>{isEditMode ? 'トーナメント編集' : 'トーナメン作る'}</h1>

        <UploadModal visible={isUploading} />

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" style={{ width: '100%', marginBottom: 8 }} />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="説明" style={{ width: '100%', marginBottom: 8 }} />

        <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)} style={{ width: '100%', marginBottom: 8 }}>
          <option value="public">公開</option>
          <option value="private">非公開</option>
          <option value="password" hidden>パスワード</option>
        </select>

        {visibility === 'password' && (
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワード入力" style={{ width: '100%', marginBottom: 8 }} />
        )}

        <div style={{ display: 'flex', marginBottom: 16 }}>
          {tabOptions.map((tab) => (
            <div
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: '8px 16px',
                borderBottom: activeTab === tab ? '3px solid #0070f3' : '1px solid #ccc',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                color: activeTab === tab ? '#0070f3' : '#666',
                marginRight: 8
              }}
            >
              {tab.toUpperCase()}
            </div>
          ))}
        </div>

        {activeTab !== 'video' && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 12px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>ファイル 選択</button>
              <span style={{ marginLeft: 12 }}>{fileNames.length} ファイル</span>
              <input type="file" ref={fileInputRef} multiple accept={activeTab === 'image' ? '.jpg,.jpeg,.png' : '.gif'} onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
            {fileNames.map((name, i) => {
  const isNew = i >= uploadedUrls.length;
  const file = files[i - uploadedUrls.length];
  const previewUrl = isNew && file ? URL.createObjectURL(file) : uploadedUrls[i];

  return (
    <div key={i} style={{ marginTop: 8 }}>
      {activeTab === 'gif' ? (
        isNew ? (
          <img src={previewUrl} alt={name} width={100} height={100} style={{ objectFit: 'cover', marginRight: 8 }} />
        ) : (
          <video
            src={previewUrl}
            width={100}
            height={100}
            muted
            loop
            playsInline
            controls
            autoPlay 
            style={{ objectFit: 'cover', marginRight: 8 }}
          />
        )
      ) : (
        <img src={previewUrl} alt={name} width={100} height={100} style={{ objectFit: 'cover', marginRight: 8 }} />
      )}

      <input value={name} onChange={(e) => handleFileNameChange(i, e.target.value)} style={{ width: 200 }} />
      <button onClick={() => handleRemoveFile(i)} style={{ marginLeft: 8 }}>削除</button>
    </div>
  );
})}
          </div>
        )}

        {activeTab === 'video' && (
          <div>
            <p style={{ marginBottom: 8, fontSize: '0.9rem', color: '#666', lineHeight: 1.6 }}>
              下記の形式で入力すれば、YouTube動画を登録できます。<br />
              複数のデータをまとめてコピー＆ペーストすることも可能です。<br /><br />
                
              <strong>入力形式(ⓣ⇨:Tab):</strong><br />
              ①YouTubeリンク&ID <strong>ⓣ⇨</strong> ②タイトル <strong>ⓣ⇨</strong> ③開始秒 <strong>ⓣ⇨</strong> ④終了秒<br /><br />

              <strong>入力例</strong><br />
              [YouTubeリンク&ID]&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;[タイトル]&emsp;[開始秒]&emsp;[終了秒]<br />
              https://www.youtube.com/watch?&emsp;できる1&emsp;&emsp;10&emsp;&emsp;&emsp;&emsp;20<br />
              https://www.youtube.com/watch?&emsp;できる2&emsp;&emsp;30&emsp;&emsp;&emsp;&emsp;40<br />
              https://www.youtube.com/watch?&emsp;できる3&emsp;&emsp;50&emsp;&emsp;&emsp;&emsp;60<br /><br />

            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>
              <div style={{ width: '25%' }}>YouTubeリンク&ID</div>
              <div style={{ width: '15%' }}>タイトル</div>
              <div style={{ width: '10%' }}>開始秒</div>
              <div style={{ width: '10%' }}>終了秒</div>
            </div>

            {videoRows.map((row, i) => (
              <div key={i} style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <input style={{ width: '25%' }} placeholder="YouTubeリンク&ID" value={row.url} onChange={(e) => {
                  const updated = [...videoRows];
                  updated[i].url = e.target.value;
                  setVideoRows(updated);
                }} onPaste={(e) => handlePaste(e, i)} />
                <input style={{ width: '15%' }} placeholder="タイトル" value={row.name} onChange={(e) => {
                  const updated = [...videoRows];
                  updated[i].name = e.target.value;
                  setVideoRows(updated);
                }} />
                <input style={{ width: '10%' }} placeholder="開始秒" value={row.stime} onChange={(e) => {
                  const updated = [...videoRows];
                  updated[i].stime = e.target.value;
                  setVideoRows(updated);
                }} />
                <input style={{ width: '10%' }} placeholder="終了秒" value={row.etime} onChange={(e) => {
                  const updated = [...videoRows];
                  updated[i].etime = e.target.value;
                  setVideoRows(updated);
                }} />
                {i > 0 && (
                  <button onClick={() => {
                    const updated = [...videoRows];
                    updated.splice(i, 1);
                    setVideoRows(updated);
                  }}>
                    削除
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setVideoRows([...videoRows, { url: '', name: '', stime: '', etime: '', valid: true }])} style={{ marginTop: 10 }}>+ 行追加</button>
          </div>
        )}

        <hr />
        <button onClick={handleSubmit} style={{ marginTop: 16, padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontSize: '1rem' }}>{isEditMode ? '編集完了' : '登録'}</button>
      </div>
    </>
  );
}
