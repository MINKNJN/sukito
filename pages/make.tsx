// /pages/make.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import UploadModal from '@/components/UploadModal';
import imageCompression from 'browser-image-compression';
import { convertToThumbnail } from '@/lib/utils';


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

  const [selectedThumbnails, setSelectedThumbnails] = useState<number[]>([]);


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

          if (data.thumbnails && Array.isArray(data.thumbnails)) {
            const selectedIndexes = data.thumbnails.map((thumb: any) => {
              return data.items.findIndex((item: any) => item.url === thumb.url);
            }).filter((i: number) => i !== -1);
            setSelectedThumbnails(selectedIndexes);
          }

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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.includes('\t')) return;
    e.preventDefault();
    const lines = pastedText.trim().split('\n');
    const newRows = lines.map((line) => {
      const [name, url, stime, etime] = line.split('\t');
      return { name: name?.trim() || '', url: url?.trim() || '', stime: stime?.trim() || '', etime: etime?.trim() || '', valid: true };
    }).filter(row => row.url);
    const updatedRows = [...videoRows];
    updatedRows.splice(index, 1, ...newRows);
    setVideoRows(updatedRows);
  };

  const handleThumbnailSelect = (index: number) => {
    setSelectedThumbnails((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index); 
      } else if (prev.length < 2) {
        return [...prev, index]; 
      } else {
        alert('代表は最大2つまで選べます'); 
        return prev;
      }
    });
  };
  

  const handleSubmit = async () => {
    if (selectedThumbnails.length < 2){
    const confirmUseDefault = confirm(
      '代表画像が2つ選択されていません。\n最初の2つを代表画像として設定してもよろしいですか？'
    );

    if (confirmUseDefault) {
      const defaultIndexes =
        activeTab === 'video'
          ? [0, 1].filter(i => i < videoRows.length)
          : [0, 1].filter(i => i < fileNames.length);

      const newSelection = [...selectedThumbnails];
      for (const idx of defaultIndexes) {
        if (!newSelection.includes(idx) && newSelection.length < 2) {
          newSelection.push(idx);
        }
      }
      setSelectedThumbnails(newSelection);

      return; 
    } else {
      return;
    }
  }
    
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

      const allUrls =
        activeTab === 'image' || activeTab === 'gif'
          ? [...uploadedUrls, ...newUploadedUrls]
          : [];

      const thumbnailItems = selectedThumbnails.map(i => ({
        name: activeTab === 'video' ? videoRows[i]?.name : fileNames[i],
        url: activeTab === 'video' ? items[i]?.url : allUrls[i],
        type: activeTab === 'video' ? 'youtube' : activeTab,
      }));
  
      const payload = {
        title,
        desc,
        visibility,
        password: visibility === 'password' ? password : '',
        type: activeTab,
        items,
        thumbnails: thumbnailItems, 
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
        router.push('/');
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
            <strong style={{ fontSize: '1.2rem'}}>トーナメントの作り方 :</strong><br />
            <p style={{
              backgroundColor: '#f0f0f0',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              overflowX: 'auto',
              whiteSpace: 'pre',
              marginBottom: '12px',
              border: '1px solid #ccc',
            }}>
              1.ファイル選択」ボタンをクリックして、画像やGIFファイルをアップロードしてください。<br />
              2.ファイル名は自動的に「タイトル」として入力されます。（必要に応じて編集可能）<br />
              3.代表画像を2つ選択してください。選択しない場合は、最初にアップロードされた2つが自動的に選ばれます。<br />
              
            </p>
            <div style={{ marginBottom: 8 }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 12px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>ファイル 選択</button>
              <span style={{ marginLeft: 12 }}>{fileNames.length} ファイル</span>
              <input type="file" ref={fileInputRef} multiple accept={activeTab === 'image' ? '.jpg,.jpeg,.png' : '.gif'} onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
            {fileNames.map((name, i) => {
              const isNew = i >= uploadedUrls.length;
              const file = files[i - uploadedUrls.length];
              const previewUrl = isNew && file ? URL.createObjectURL(file) : uploadedUrls[i];
              const isSelected = selectedThumbnails.includes(i);

              return (
                <div
                  key={i}
                  style={{
                    marginTop: 12,
                    border: isSelected ? '2px solid #0070f3' : '1px solid #ccc',
                    padding: 10,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    backgroundColor: '#fff',
                  }}
                >
                  {activeTab === 'gif' && !isNew && previewUrl.endsWith('.mp4') ? (
                    <video
                      src={previewUrl}
                      width={100}
                      height={100}
                      muted
                      loop
                      autoPlay
                      playsInline
                      style={{ objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: 6 }}
                    />
                  )}


                  <div style={{ flex: 1 }}>
                    <input
                      value={name}
                      onChange={(e) => handleFileNameChange(i, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '0.9rem',
                        marginBottom: 6,
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (!isSelected && selectedThumbnails.length >= 2) {
                            alert('代表画像は最大2つまでです。');
                            return;
                          }
                          handleThumbnailSelect(i);
                        }}
                        style={{ width: 16, height: 16 }}
                      />
                        代表画像
                      </label>

                      <button
                        onClick={() => handleRemoveFile(i)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.85rem',
                          backgroundColor: '#eee',
                          border: '1px solid #999',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}



          </div>
        )}

        {activeTab === 'video' && (
          <div>
            <strong style={{ fontSize: '1.2rem'}}>トーナメントの作り方 :</strong><br />
            <p style={{
              backgroundColor: '#f0f0f0',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              overflowX: 'auto',
              whiteSpace: 'pre',
              marginBottom: '12px',
              border: '1px solid #ccc',
            }}>
              下記の形式で入力すれば、YouTube動画を登録できます。<br />
              複数のデータをまとめてコピー＆ペーストすることも可能です。<br /><br />
                
              <strong>複数のデータ入力形式(ⓣ⇨:Tab):</strong><br />
              タイトル <strong>[TAB⇨]</strong> YouTubeリンク <strong>[TAB⇨]</strong> 開始秒 <strong>[TAB⇨]</strong> 終了秒 <strong>[ENTER]</strong><br />
              
            </p>

            <strong style={{ fontSize: '1.2rem'}}>複数のデータ入力例(コピー可)</strong><br />

            <textarea
              readOnly
              value={`タイトル\tYouTubeリンク\t開始秒\t終了秒\nダンスシーン1\thttps://youtu.be/abc123xyz\t10\t20\n面白い瞬間2\thttps://youtu.be/def456uvw\t30\t40`}
              style={{
                width: '100%',
                height: 100,
                fontSize: '0.95rem',
                marginBottom: 16,
                padding: '10px 14px',
                border: '2px dashed #66aaff',
                borderRadius: 8,
                backgroundColor: '#f9fafe',
                color: '#333',
                whiteSpace: 'pre',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.3s',
              }}
            />

            <textarea
              placeholder="ここにコピー貼り付け(複数行まとめて貼り付け可)"
              onPaste={(e) => handlePaste(e, 0)}
              style={{
                width: '100%',
                height: 100,
                fontSize: '0.95rem',
                marginBottom: 16,
                padding: '10px 14px',
                border: '2px dashed #0070f3',
                borderRadius: 8,
                backgroundColor: '#e8f2ff',
                color: '#333',
                whiteSpace: 'pre',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0050c3';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#0070f3';
              }}
            />


            <div style={{ display: 'flex', gap: 8, marginTop: 16, fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>
              <div style={{ width: '25%' }}>YouTubeリンク</div>
              <div style={{ width: '15%' }}>タイトル</div>
              <div style={{ width: '10%' }}>開始秒</div>
              <div style={{ width: '10%' }}>終了秒</div>
            </div>

            {videoRows.map((row, i) => {
              const videoId = extractVideoId(row.url);
              const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?start=${row.stime}&end=${row.etime}` : '';
              const thumbnailUrl = convertToThumbnail(embedUrl);
              const isSelected = selectedThumbnails.includes(i);

              return (
                <div key={i} style={{
                  marginTop: 12,
                  border: isSelected ? '2px solid #0070f3' : '1px solid #ccc',
                  padding: 10,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  backgroundColor: '#fff',
                }}>
                  <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: 6,
                    backgroundImage: `url(${thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#f0f0f0',
                  }} />

                  <div style={{ flex: 1 }}>
                    <input
                      value={row.name}
                      onChange={(e) => {
                        const updated = [...videoRows];
                        updated[i].name = e.target.value;
                        setVideoRows(updated);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '0.9rem',
                        marginBottom: 6,
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      }}
                      placeholder="タイトル"
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={row.url}
                        onChange={(e) => {
                          const updated = [...videoRows];
                          updated[i].url = e.target.value;
                          setVideoRows(updated);
                        }}
                        onPaste={(e) => handlePaste(e, i)}
                        placeholder="YouTubeリンク&ID"
                        style={{ width: '60%' }}
                      />
                      <input
                        value={row.stime}
                        onChange={(e) => {
                          const updated = [...videoRows];
                          updated[i].stime = e.target.value;
                          setVideoRows(updated);
                        }}
                        placeholder="開始秒"
                        style={{ width: '20%' }}
                      />
                      <input
                        value={row.etime}
                        onChange={(e) => {
                          const updated = [...videoRows];
                          updated[i].etime = e.target.value;
                          setVideoRows(updated);
                        }}
                        placeholder="終了秒"
                        style={{ width: '20%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleThumbnailSelect(i)}
                          style={{ width: 16, height: 16 }}
                        />
                        代表画像
                      </label>

                      {i > 0 && (
                        <button
                          onClick={() => {
                            const updated = [...videoRows];
                            updated.splice(i, 1);
                            setVideoRows(updated);
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.85rem',
                            backgroundColor: '#eee',
                            border: '1px solid #999',
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <button onClick={() => setVideoRows([...videoRows, { url: '', name: '', stime: '', etime: '', valid: true }])} style={{ marginTop: 10 }}>+ 行追加</button>
          </div>
        )}

        <hr />
        <button onClick={handleSubmit} style={{ marginTop: 16, padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontSize: '1rem' }}>{isEditMode ? '編集完了' : '登録'}</button>
      </div>
    </>
  );
}
