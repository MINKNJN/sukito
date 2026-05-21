// /pages/make.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import UploadModal from '@/components/UploadModal';
import { useAlert } from '@/lib/alert';
import imageCompression from 'browser-image-compression';
import { convertToThumbnail } from '@/lib/utils';


const tabOptions = ['image', 'gif', 'youtube'] as const;
type TabType = typeof tabOptions[number];

interface VideoRow {
  url: string;
  name: string;
  stime: string;
  etime: string;
  valid: boolean;
  itemId?: string;
}

export default function MakePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const { id } = router.query;

  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('image');

  const [files, setFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadedThumbUrls, setUploadedThumbUrls] = useState<string[]>([]);
  const [uploadedItemIds, setUploadedItemIds] = useState<(string | undefined)[]>([]);
  const [replacements, setReplacements] = useState<{ [index: number]: File }>({});
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [videoRows, setVideoRows] = useState<VideoRow[]>([{
    url: '', name: '', stime: '', etime: '', valid: true
  }]);
  const [userId, setUserId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [itemsHistory, setItemsHistory] = useState<any[]>([]);

  const [selectedThumbnails, setSelectedThumbnails] = useState<number[]>([]);

  const [uploadProgress, setUploadProgress] = useState<number>(0); 
  const [uploadMessage, setUploadMessage] = useState<string>('アップロード中...');
  const [videoPasteError, setVideoPasteError] = useState<string>(''); // 유튜브 붙여넣기 에러
  const { showAlert, showConfirm } = useAlert();

  // 반응형 스타일 유틸
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('ログインしてください。', 'error');
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
          showAlert('確認に失敗', 'error');
          router.push('/login');
        }
      } catch (err) {
        console.error('確認に失敗:', err);
        showAlert('確認に失敗', 'error');
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
          setActiveTab(data.type);
          setItemsHistory(data.itemsHistory || []); 

          if (data.thumbnails && Array.isArray(data.thumbnails)) {
            const selectedIndexes = data.thumbnails.map((thumb: any) => {
              return data.items.findIndex((item: any) => item.url === thumb.url);
            }).filter((i: number) => i !== -1);
            setSelectedThumbnails(selectedIndexes);
          }

          if (data.type === 'youtube') {
            const videos = data.items.map((i: any) => {
              const match = i.url.match(/start=(\d+)&end=(\d+)/);
              return {
                url: i.url,
                name: i.name,
                stime: match?.[1] || '',
                etime: match?.[2] || '',
                valid: true,
                itemId: i.itemId,
              };
            });
            setVideoRows(videos);
          } else {
            setUploadedUrls(data.items.map((i: any) => i.url));
            setUploadedThumbUrls(data.items.map((i: any) => i.thumbUrl || ''));
            setFileNames(data.items.map((i: any) => i.name));
            setUploadedItemIds(data.items.map((i: any) => i.itemId));
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
      showAlert('編集中はデータの種類を変更できません。', 'error');
      return;
    }
    if (!isEditMode) {
      showConfirm('タブを変更すると入力内容がリセットされます。\n続行してもよろしいですか？', () => {
        setActiveTab(tab);
        clearFiles();
        setVideoRows([{ url: '', name: '', stime: '', etime: '', valid: true }]);
      });
      return;
    }
    setActiveTab(tab);
    clearFiles();
    setVideoRows([{ url: '', name: '', stime: '', etime: '', valid: true }]);
  };



const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = Array.from(e.target.files || []);

  const filtered = selectedFiles.filter(file => {
    const isMp4 = /\.mp4$/i.test(file.name);
    const maxSizeMB = isMp4 ? 10 : 20;
    const isValidSize = file.size <= maxSizeMB * 1024 * 1024;

    const isValidType =
      (activeTab === 'image' && /\.(jpe?g|png)$/i.test(file.name)) ||
      (activeTab === 'gif' && /\.(gif|mp4)$/i.test(file.name));

    if (!isValidSize) {
      showAlert(`「${file.name}」は${maxSizeMB}MB以下のみアップロード可能です。`, 'error');
    }
    if (!isValidType) {
      showAlert(`「${file.name}」はサポートされていない形式です。`, 'error');
    }

    return isValidSize && isValidType;
  });

  setFiles(prev => [...prev, ...filtered]);

  setFileNames(prev => [
    ...prev,
    ...filtered.map(f => f.name.replace(/\.(jpe?g|png|gif|mp4)$/i, '')),
  ]);
};

  const clearFiles = () => {
    setFiles([]);
    setFileNames([]);
    setUploadedUrls([]);
    setUploadedThumbUrls([]);
    setUploadedItemIds([]);
    setReplacements({});
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
      const newItemIds = [...uploadedItemIds];
      newUrls.splice(index, 1);
      newNames.splice(index, 1);
      newItemIds.splice(index, 1);
      setUploadedUrls(newUrls);
      setFileNames(newNames);
      setUploadedItemIds(newItemIds);
      // 교체 예정 파일도 함께 제거
      setReplacements(prev => {
        const next = { ...prev };
        delete next[index];
        // index보다 큰 키는 한 칸씩 앞으로 이동
        const shifted: { [k: number]: File } = {};
        Object.entries(next).forEach(([k, v]) => {
          const n = Number(k);
          shifted[n > index ? n - 1 : n] = v;
        });
        return shifted;
      });
    }
  };

  const handleReplaceClick = (index: number) => {
    setReplacingIndex(index);
    replaceFileInputRef.current?.click();
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null) {
      setReplacingIndex(null);
      return;
    }
    const isMp4 = /\.mp4$/i.test(file.name);
    const maxSizeMB = isMp4 ? 10 : 20;
    const isValidSize = file.size <= maxSizeMB * 1024 * 1024;
    const isValidType =
      (activeTab === 'image' && /\.(jpe?g|png)$/i.test(file.name)) ||
      (activeTab === 'gif' && /\.(gif|mp4)$/i.test(file.name));

    if (!isValidSize) {
      showAlert(`「${file.name}」は${maxSizeMB}MB以下のみアップロード可能です。`, 'error');
    } else if (!isValidType) {
      showAlert(`「${file.name}」はサポートされていない形式です。`, 'error');
    } else {
      setReplacements(prev => ({ ...prev, [replacingIndex]: file }));
    }
    setReplacingIndex(null);
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const checkYoutubeEmbed = async (videoId: string): Promise<{ ok: boolean; status: number }> => {
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
      );
      return { ok: res.ok, status: res.status };
    } catch {
      return { ok: false, status: -1 };
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.includes('\t')) return;
    e.preventDefault();
    setVideoPasteError('');
    const lines = pastedText.trim().split('\n');
    const newRows: VideoRow[] = [];
    let errorLine = -1;
    lines.forEach((line, idx) => {
      const parts = line.split('\t');
      if (parts.length < 4) {
        if (errorLine === -1) errorLine = idx + 1;
        return;
      }
      const [name, url, stime, etime] = parts;
      // 유튜브 링크/ID 유효성
      const isValidUrl = url.includes('youtube.com') || url.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(url.trim());
      if (!isValidUrl) {
        if (errorLine === -1) errorLine = idx + 1;
        return;
      }
      newRows.push({
        name: name?.trim() || '',
        url: url?.trim() || '',
        stime: stime?.trim() || '',
        etime: etime?.trim() || '',
        valid: true
      });
    });
    if (errorLine !== -1) {
      setVideoPasteError(`${errorLine}番目の行にエラーがあります。（タイトル、YouTubeリンク、開始秒、終了秒の順でタブ区切りにしてください）`);
      return;
    }
    if (newRows.length === 0) {
      setVideoPasteError('ペーストされたデータが有効ではありません。');
      return;
    }
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
        showAlert('代表画像は最大2つまで選択できます。', 'warning');
        return prev;
      }
    });
  };
  

  type UploadItem = { name: string; url: string; type: 'image' | 'gif' | 'youtube'; thumbUrl?: string; itemId?: string };

  const doSave = async (
    allItems: UploadItem[],
    gameId: string | string[] | undefined
  ) => {
    const validItems = allItems.filter(item => item.url);
    const thumbnailItems = selectedThumbnails
      .map(i => {
        const item = allItems[i];
        if (!item || !item.url) return null;
        return {
          name: item.name,
          url: item.url,
          type: item.type,
          ...(item.thumbUrl ? { thumbUrl: item.thumbUrl } : {}),
        };
      })
      .filter(Boolean);

    const payload = {
      title,
      desc,
      type: activeTab,
      items: validItems,
      thumbnails: thumbnailItems,
      itemsHistory: mergeItemsHistory(itemsHistory, validItems),
      createdBy: userId,
      [isEditMode ? 'updatedAt' : 'createdAt']: new Date().toISOString(),
    };

    const res = await fetch(`/api/games?id=${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (res.ok) {
      setUploadMessage('完了しました！');
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      showAlert(isEditMode ? '編集が完了しました。' : '登録が完了しました。', 'success');
      router.push('/');
    } else {
      showAlert(result.message || '保存に失敗しました。もう一度お試しください。', 'error');
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadMessage('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert('タイトルを入力してください。', 'error');
      return;
    }
    if (!desc.trim()) {
      showAlert('説明を入力してください。', 'error');
      return;
    }
    if (activeTab === 'image' || activeTab === 'gif') {
      if (fileNames.length < 2) {
        showAlert('ファイルを2つ以上選択してください。', 'error');
        return;
      }
    }
    if (activeTab === 'youtube') {
      const validVideoCount = videoRows.filter(row => row.name.trim() && row.url.trim() && row.stime.trim() && row.etime.trim()).length;
      if (validVideoCount < 2) {
        showAlert('YouTube情報を2つ以上入力してください。', 'error');
        return;
      }
    }
    if (selectedThumbnails.length !== 2) {
      showAlert('代表画像を2つ選択してください。', 'error');
      return;
    }

    setIsUploading(true);
    setUploadMessage('ゲームIDを作成中...');
    setUploadProgress(0);

    let gameId = id;
    if (!isEditMode) {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, desc, type: activeTab,
          items: [], thumbnails: [], itemsHistory: [],
          createdBy: userId, createdAt: new Date().toISOString(),
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.id) {
        showAlert(result.message || 'ゲームIDの作成に失敗しました。', 'error');
        setIsUploading(false);
        return;
      }
      gameId = result.id;
    }

    setUploadMessage('ファイルをアップロード中...');
    setUploadProgress(0);

    const failedFiles: { fileName: string; reason: string }[] = [];
    let items: UploadItem[] = [];

    if (activeTab === 'image') {
      const replaceCount = Object.keys(replacements).length;
      const totalOps = replaceCount + files.length;
      let opIndex = 0;

      // 기존 항목 처리 (교체 예정 파일이 있으면 업로드)
      const existingItems: UploadItem[] = [];
      for (let i = 0; i < uploadedUrls.length; i++) {
        const replacementFile = replacements[i];
        if (replacementFile) {
          opIndex++;
          setUploadMessage(`画像を変更中 (${opIndex}/${totalOps})`);
          setUploadProgress(Math.round(opIndex / totalOps * 100));
          try {
            const compressedFile = await imageCompression(replacementFile, {
              maxSizeMB: 2, maxWidthOrHeight: 1024, useWebWorker: true,
            });
            const formData = new FormData();
            formData.append('file', compressedFile);
            if (gameId) formData.append('folder', String(gameId));
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok || !data.results?.[0]?.url) {
              failedFiles.push({ fileName: replacementFile.name, reason: data.message || 'アップロード中にエラーが発生しました' });
              existingItems.push({ name: fileNames[i], url: uploadedUrls[i], type: 'image', ...(uploadedItemIds[i] ? { itemId: uploadedItemIds[i] } : {}) });
            } else {
              existingItems.push({ name: fileNames[i], url: data.results[0].url, type: 'image', ...(uploadedItemIds[i] ? { itemId: uploadedItemIds[i] } : {}) });
            }
          } catch {
            failedFiles.push({ fileName: replacementFile.name, reason: '通信エラーが発生しました。接続状況を確認してください' });
            existingItems.push({ name: fileNames[i], url: uploadedUrls[i], type: 'image', ...(uploadedItemIds[i] ? { itemId: uploadedItemIds[i] } : {}) });
          }
        } else {
          existingItems.push({ name: fileNames[i], url: uploadedUrls[i], type: 'image', ...(uploadedItemIds[i] ? { itemId: uploadedItemIds[i] } : {}) });
        }
      }

      // 신규 파일 업로드
      const newItems: UploadItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const itemName = fileNames[uploadedUrls.length + i] || file.name;
        opIndex++;
        setUploadMessage(`画像をアップロード中 (${opIndex}/${totalOps})`);
        setUploadProgress(Math.round(opIndex / totalOps * 100));
        try {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 2, maxWidthOrHeight: 1024, useWebWorker: true,
          });
          const formData = new FormData();
          formData.append('file', compressedFile);
          if (gameId) formData.append('folder', String(gameId));
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok || !data.results?.[0]?.url) {
            failedFiles.push({ fileName: file.name, reason: data.message || 'アップロード中にエラーが発生しました' });
          } else {
            newItems.push({ name: itemName, url: data.results[0].url, type: 'image' });
          }
        } catch {
          failedFiles.push({ fileName: file.name, reason: '通信エラーが発生しました。接続状況を確認してください' });
        }
      }
      items = [...existingItems, ...newItems];
    }

    if (activeTab === 'gif') {
      const replaceCount = Object.keys(replacements).length;
      const totalOps = replaceCount + files.length;
      let opIndex = 0;

      // 기존 항목 처리 (교체 예정 파일이 있으면 업로드)
      const existingItems: UploadItem[] = [];
      for (let i = 0; i < uploadedUrls.length; i++) {
        const replacementFile = replacements[i];
        if (replacementFile) {
          opIndex++;
          setUploadMessage(`GIF/MP4を変更中 (${opIndex}/${totalOps})`);
          setUploadProgress(Math.round(opIndex / totalOps * 100));
          try {
            const formData = new FormData();
            formData.append('file', replacementFile);
            if (gameId) formData.append('folder', String(gameId));
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok || !data.results?.[0]?.mp4Url) {
              let reason = data.message || 'アップロード中にエラーが発生しました';
              if (res.status === 400 && data.message?.includes('10MB')) reason = 'ファイルが大きすぎます（MP4は10MBまで）';
              else if (res.status === 500) reason = '変換またはアップロード中にエラーが発生しました。しばらく待ってから再試行してください';
              failedFiles.push({ fileName: replacementFile.name, reason });
              existingItems.push({ name: fileNames[i], url: uploadedUrls[i], type: 'gif', ...(uploadedThumbUrls[i] ? { thumbUrl: uploadedThumbUrls[i] } : {}), ...(uploadedItemIds[i] ? { itemId: uploadedItemIds[i] } : {}) });
            } else {
              existingItems.push({
                name: fileNames[i],
                url: data.results[0].mp4Url,
                type: 'gif',
                ...(data.results[0].thumbnailUrl ? { thumbUrl: data.results[0].thumbnailUrl } : {}),
                ...(uploadedItemIds[i] ? { itemId: uploadedItemIds[i] } : {}),
              });
            }
          } catch {
            failedFiles.push({ fileName: replacementFile.name, reason: '通信エラーが発生しました。接続状況を確認してください' });
            existingItems.push({ name: fileNames[i], url: uploadedUrls[i], type: 'gif', ...(uploadedThumbUrls[i] ? { thumbUrl: uploadedThumbUrls[i] } : {}), ...(uploadedItemIds[i] ? { itemId: uploadedItemIds[i] } : {}) });
          }
        } else {
          existingItems.push({ name: fileNames[i], url: uploadedUrls[i], type: 'gif', ...(uploadedThumbUrls[i] ? { thumbUrl: uploadedThumbUrls[i] } : {}), ...(uploadedItemIds[i] ? { itemId: uploadedItemIds[i] } : {}) });
        }
      }

      // 신규 파일 업로드
      const newItems: UploadItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const itemName = fileNames[uploadedUrls.length + i] || file.name;
        opIndex++;
        setUploadMessage(`GIF/MP4をアップロード中 (${opIndex}/${totalOps})`);
        setUploadProgress(Math.round(opIndex / totalOps * 100));
        try {
          const formData = new FormData();
          formData.append('file', file);
          if (gameId) formData.append('folder', String(gameId));
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok || !data.results?.[0]?.mp4Url) {
            let reason = data.message || 'アップロード中にエラーが発生しました';
            if (res.status === 400 && data.message?.includes('10MB')) reason = 'ファイルが大きすぎます（MP4は10MBまで）';
            else if (res.status === 400 && data.message?.includes('20MB')) reason = 'ファイルが大きすぎます（GIF/WEBPは20MBまで）';
            else if (res.status === 500) reason = '変換またはアップロード中にエラーが発生しました。しばらく待ってから再試行してください';
            failedFiles.push({ fileName: file.name, reason });
          } else {
            newItems.push({
              name: itemName,
              url: data.results[0].mp4Url,
              type: 'gif',
              ...(data.results[0].thumbnailUrl ? { thumbUrl: data.results[0].thumbnailUrl } : {}),
            });
          }
        } catch {
          failedFiles.push({ fileName: file.name, reason: '通信エラーが発生しました。接続状況を確認してください' });
        }
      }
      items = [...existingItems, ...newItems];
    }

    if (activeTab === 'youtube') {
      setUploadMessage('YouTubeリンクを確認中...');
      setUploadProgress(50);
      const invalidRows: { row: VideoRow; reason: string }[] = [];
      for (const row of videoRows) {
        const videoId = extractVideoId(row.url);
        if (!videoId) {
          invalidRows.push({ row, reason: 'YouTubeのURLまたは動画IDの形式が正しくありません。URLを確認してください。' });
          continue;
        }
        const { ok, status } = await checkYoutubeEmbed(videoId);
        if (!ok) {
          let reason = '動画の確認中にエラーが発生しました。しばらく待ってから再試行してください。';
          if (status === 401) reason = 'この動画は埋め込みが禁止されています。動画の設定で埋め込みが許可されているものに変更してください。';
          else if (status === 404) reason = '動画が見つかりません。削除されているか非公開の可能性があります。別の動画を選んでください。';
          invalidRows.push({ row, reason });
        }
      }
      if (invalidRows.length > 0) {
        const failList = invalidRows
          .map(({ row, reason }) => `・${row.name || '(名前未入力)'}\n　→ ${reason}`)
          .join('\n\n');
        showAlert(`以下のYouTubeリンクに問題があります。\n\n${failList}`, 'error');
        setIsUploading(false);
        return;
      }
      items = videoRows
        .filter(row => row.name.trim() && row.url.trim())
        .map(row => {
          const videoId = extractVideoId(row.url);
          return {
            name: row.name,
            url: videoId ? `https://www.youtube.com/embed/${videoId}?start=${row.stime}&end=${row.etime}` : '',
            type: 'youtube' as const,
            ...(row.itemId ? { itemId: row.itemId } : {}),
          };
        });
    }

    // 업로드 실패 항목 처리
    if (failedFiles.length > 0) {
      setIsUploading(false);
      const validItems = items.filter(item => item.url);
      const failList = failedFiles.map(f => `・${f.fileName}\n　→ ${f.reason}`).join('\n\n');

      if (validItems.length < 2) {
        showAlert(
          `アップロードに失敗したファイルがあり、保存できるファイルが2件未満になりました。\n\nファイルを修正してから、もう一度お試しください。\n\n【失敗したファイル】\n${failList}`,
          'error'
        );
        return;
      }

      showConfirm(
        `一部のファイルをアップロードできませんでした。\n\n【失敗したファイル】\n${failList}\n\n成功した ${validItems.length} 件のファイルだけで保存しますか？\n（失敗したファイルは一覧から削除してから再度追加できます）`,
        async () => {
          setIsUploading(true);
          setUploadMessage('ゲームを保存中...');
          setUploadProgress(100);
          await doSave(items, gameId);
        }
      );
      return;
    }

    setUploadMessage('ゲームを保存中...');
    setUploadProgress(100);
    await doSave(items, gameId);
  };

  return (
    <>
      <Header />
      <div style={{ background: 'linear-gradient(120deg, #f8fafc 0%, #e6f7ff 100%)', minHeight: '100vh', padding: isMobile ? '16px 0' : '40px 0' }}>
        <div style={{
          background: '#fff',
          borderRadius: isMobile ? 12 : 18,
          boxShadow: '0 4px 24px #b3e5fc44',
          maxWidth: isMobile ?  '98vw' : 680,
          margin: '0 auto',
          padding: isMobile ? '18px 6vw 18px 6vw' : '36px 20px 28px 20px',
          position: 'relative',
          border: '1.5px solid #e0f7fa',
        }}>
          <h1 style={{ fontWeight: 700, fontSize: isMobile ? 22 : 28, marginBottom: isMobile ? 18 : 28, letterSpacing: -1, color: '#4caf50', textAlign: 'center', fontFamily: '"Noto Sans JP", "Hiragino Sans", "Meiryo", sans-serif' }}>{isEditMode ? 'トーナメント編集' : 'トーナメント作る'}</h1>

          <UploadModal visible={isUploading} progress={uploadProgress} message={uploadMessage} />

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" style={{ width: '100%', marginBottom: isMobile ? 8 : 10, padding: isMobile ? '10px 10px' : '12px 14px', borderRadius: 10, border: '1.5px solid #b2ebf2', fontSize: isMobile ? 15 : 17, background: '#f7fafd', color: '#222', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', boxShadow: '0 1px 4px #b2ebf222', display: 'block' }} />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="説明" style={{ width: '100%', marginBottom: isMobile ? 8 : 10, padding: isMobile ? '10px 10px' : '12px 14px', borderRadius: 10, border: '1.5px solid #b2ebf2', fontSize: isMobile ? 14 : 16, background: '#f7fafd', color: '#222', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: isMobile ? 40 : 56, fontFamily: 'inherit', boxShadow: '0 1px 4px #b2ebf222', display: 'block' }} />

          <div style={{ display: 'flex', marginBottom: isMobile ? 12 : 20, gap: isMobile ? 4 : 8, flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', alignItems: 'center' }}>
            {tabOptions.map((tab) => (
              <div
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  width: isMobile ? '100%' : 120,
                  maxWidth: 180,
                  minWidth: isMobile ? 0 : 90,
                  padding: isMobile ? '8px 0' : '10px 22px',
                  borderRadius: 10,
                  border: activeTab === tab ? '2.5px solid #4caf50' : '1.5px solid #b2ebf2',
                  background: activeTab === tab ? '#4caf50' : '#f7fafd',
                  color: activeTab === tab ? '#fff' : '#4caf50',
                  fontWeight: 700,
                  fontSize: isMobile ? 15 : 16,
                  cursor: 'pointer',
                  boxShadow: activeTab === tab ? '0 2px 8px #4caf5022' : 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  textAlign: 'center',
                  margin: isMobile ? '0 0 4px 0' : '0',
                  display: 'block',
                }}
              >
                {tab.toUpperCase()}
              </div>
            ))}
          </div>

          {activeTab !== 'youtube' && (
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
                {activeTab === 'image'
                  ? <>1. 「ファイル選択」から JPG・PNG ファイルを選んでください<br />2. ファイル名が自動でタイトルになります（編集可能）<br />3. 代表画像を2つ選択してください。未選択の場合は最初の2つが自動的に選ばれます</>
                  : <>1. 「ファイル選択」から GIF・WEBP・MP4 ファイルを選んでください（GIF/WEBP: 最大20MB、MP4: 最大10MB）<br />2. GIF/WEBPはMP4に自動変換されます。MP4はそのままアップロードされます<br />3. 代表画像を2つ選択してください。未選択の場合は最初の2つが自動的に選ばれます</>
                }
                
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 160,
                    padding: '10px 0',
                    fontSize: '1.05rem',
                    backgroundColor: '#fff',
                    color: '#4caf50',
                    border: '1.5px solid #4caf50',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px #b2ebf222',
                    transition: 'background 0.2s',
                    height: 44,
                    display: 'block',
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#e8f5e9')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  ファイル選択
                </button>
                <span style={{ marginLeft: 8 }}>{fileNames.length} ファイル</span>
                <div style={{ flex: 1 }} />
                <input type="file" ref={fileInputRef} multiple accept={activeTab === 'image' ? '.jpg,.jpeg,.png' : '.gif,.mp4'} onChange={handleFileChange} style={{ display: 'none' }} />
                <input type="file" ref={replaceFileInputRef} accept={activeTab === 'image' ? '.jpg,.jpeg,.png' : '.gif,.mp4'} onChange={handleReplaceFileChange} style={{ display: 'none' }} />
              </div>
              {fileNames.map((name, i) => {
                const isNew = i >= uploadedUrls.length;
                const file = files[i - uploadedUrls.length];
                const replacementFile = !isNew ? replacements[i] : undefined;
                const isReplacing = !!replacementFile;

                // 미리보기: 교체 예정 파일 > 새 파일 > 기존 URL
                const previewUrl = isReplacing
                  ? URL.createObjectURL(replacementFile!)
                  : isNew && file ? URL.createObjectURL(file)
                  : uploadedUrls[i];

                const isVideo =
                  (isReplacing && (replacementFile!.type === 'video/mp4' || /\.mp4$/i.test(replacementFile!.name))) ||
                  (!isReplacing && isNew && file?.type === 'video/mp4') ||
                  (!isReplacing && !isNew && previewUrl?.endsWith('.mp4'));

                const isSelected = selectedThumbnails.includes(i);

                return (
                  <div
                    key={i}
                    style={{
                      marginTop: 12,
                      border: isReplacing ? '2px solid #f59e0b' : isSelected ? '2px solid #4caf50' : '1px solid #ccc',
                      padding: 10,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      backgroundColor: isReplacing ? '#fffbeb' : '#fff',
                    }}
                  >
                    {activeTab === 'gif' && isVideo ? (
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

                      {isReplacing && (
                        <div style={{ fontSize: '0.8rem', color: '#b45309', marginBottom: 4 }}>
                          変更予定: {replacementFile!.name}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (!isSelected && selectedThumbnails.length >= 2) {
                                showAlert('代表画像は最大2つまでです。', 'warning');
                                return;
                              }
                              handleThumbnailSelect(i);
                            }}
                            style={{ width: 16, height: 16 }}
                          />
                          代表画像
                        </label>

                        {!isNew && !isReplacing && (
                          <button
                            onClick={() => handleReplaceClick(i)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.85rem',
                              backgroundColor: '#fff7ed',
                              border: '1px solid #f59e0b',
                              borderRadius: 4,
                              cursor: 'pointer',
                              color: '#b45309',
                            }}
                          >
                            変更
                          </button>
                        )}

                        {isReplacing && (
                          <button
                            onClick={() => setReplacements(prev => { const n = { ...prev }; delete n[i]; return n; })}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.85rem',
                              backgroundColor: '#fef3c7',
                              border: '1px solid #f59e0b',
                              borderRadius: 4,
                              cursor: 'pointer',
                              color: '#92400e',
                            }}
                          >
                            取消
                          </button>
                        )}

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

          {activeTab === 'youtube' && (
            <div>
              <strong style={{ fontSize: '1.2rem', marginBottom: 8, display: 'block' }}>トーナメントの作り方 :</strong>
              <p style={{
                backgroundColor: '#f0f0f0',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.95rem',
                marginBottom: '12px',
                border: '1.5px solid #b2ebf2',
                color: '#333',
                lineHeight: 1.7,
              }}>
                下記の形式で入力すれば、YouTube動画を登録できます。<br />
                複数のデータをまとめてコピー＆ペーストすることも可能です。<br /><br />
                <strong>複数のデータ入力形式(ⓣ⇨:Tab):</strong><br />
                タイトル <strong>[TAB⇨]</strong> YouTubeリンク <strong>[TAB⇨]</strong> 開始秒 <strong>[TAB⇨]</strong> 終了秒 <strong>[ENTER]</strong><br />
              </p>

              <strong style={{ fontSize: '1.1rem', marginBottom: 4, display: 'block' }}>複数のデータ入力例(コピー可)</strong>
              <textarea
                readOnly
                value={`タイトル\tYouTubeリンク\t開始秒\t終了秒\nダンスシーン1\thttps://youtu.be/abc123xyz\t10\t20\n面白い瞬間2\thttps://youtu.be/def456uvw\t30\t40`}
                style={{
                  width: '100%',
                  height: 80,
                  fontSize: '0.95rem',
                  marginBottom: 12,
                  padding: '10px 14px',
                  border: '1.5px solid #b2ebf2',
                  borderRadius: 8,
                  backgroundColor: '#f7fafd',
                  color: '#333',
                  whiteSpace: 'pre',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxShadow: '0 1px 4px #b2ebf222',
                }}
              />

              <textarea
                placeholder="ここにコピー貼り付け(複数行まとめて貼り付け可)"
                onPaste={(e) => handlePaste(e, 0)}
                style={{
                  width: '100%',
                  height: 80,
                  fontSize: '0.95rem',
                  marginBottom: 12,
                  padding: '10px 14px',
                  border: videoPasteError ? '2px solid #ff4d6d' : '1.5px solid #b2ebf2',
                  borderRadius: 8,
                  backgroundColor: '#e8f2ff',
                  color: '#333',
                  whiteSpace: 'pre',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxShadow: '0 1px 4px #b2ebf222',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0050c3';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = videoPasteError ? '#ff4d6d' : '#b2ebf2';
                }}
              />
              {videoPasteError && (
                <div style={{ color: '#ff4d6d', marginBottom: 8, fontWeight: 700 }}>{videoPasteError}</div>
              )}

              {videoRows.map((row, i) => {
                const videoId = extractVideoId(row.url);
                const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?start=${row.stime}&end=${row.etime}` : '';
                const thumbnailUrl = convertToThumbnail(embedUrl);
                const isSelected = selectedThumbnails.includes(i);

                return (
                  <div
                    key={i}
                    style={{
                      marginTop: 12,
                      border: isSelected ? '2px solid #4caf50' : '1.5px solid #b2ebf2',
                      padding: 10,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      backgroundColor: '#fff',
                      boxShadow: '0 1px 4px #b2ebf222',
                      flexDirection: isMobile ? 'column' : 'row',
                    }}
                  >
                    {/* 썸네일 */}
                    <div style={{
                      width: 100,
                      height: 100,
                      borderRadius: 6,
                      backgroundImage: `url(${thumbnailUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: '#f0f0f0',
                      flexShrink: 0,
                      marginBottom: isMobile ? 8 : 0,
                    }} />

                    {/* 입력란들 */}
                    <div style={{ width: '100%', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, width: '100%', overflow: 'hidden' }}>
                        <input
                          value={row.name}
                          onChange={(e) => {
                            const updated = [...videoRows];
                            updated[i].name = e.target.value;
                            setVideoRows(updated);
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '6px 8px',
                            fontSize: '0.9rem',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            background: '#f7fafd',
                            color: '#222',
                            fontFamily: 'inherit',
                            boxShadow: '0 1px 4px #b2ebf222',
                          }}
                          placeholder="タイトル"
                        />
                        <input
                          value={row.url}
                          onChange={(e) => {
                            const updated = [...videoRows];
                            updated[i].url = e.target.value;
                            setVideoRows(updated);
                          }}
                          onPaste={(e) => handlePaste(e, i)}
                          placeholder="YouTubeリンク&ID"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            background: '#f7fafd',
                            color: '#222',
                            fontFamily: 'inherit',
                            boxShadow: '0 1px 4px #b2ebf222',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexDirection: isMobile ? 'column' : 'row', width: '100%', overflow: 'hidden' }}>
                        <input
                          value={row.stime}
                          onChange={(e) => {
                            const updated = [...videoRows];
                            updated[i].stime = e.target.value;
                            setVideoRows(updated);
                          }}
                          placeholder="開始秒"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            background: '#f7fafd',
                            color: '#222',
                            fontFamily: 'inherit',
                            boxShadow: '0 1px 4px #b2ebf222',
                          }}
                        />
                        <input
                          value={row.etime}
                          onChange={(e) => {
                            const updated = [...videoRows];
                            updated[i].etime = e.target.value;
                            setVideoRows(updated);
                          }}
                          placeholder="終了秒"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            background: '#f7fafd',
                            color: '#222',
                            fontFamily: 'inherit',
                            boxShadow: '0 1px 4px #b2ebf222',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleThumbnailSelect(i)}
                            style={{ width: 16, height: 16 }}
                          />
                          代表画像
                        </label>
                        {(
                          <button
                            onClick={() => {
                              const updated = [...videoRows];
                              updated.splice(i, 1);
                              setVideoRows(updated.length > 0 ? updated : [{ url: '', name: '', stime: '', etime: '', valid: true }]);
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <button
                  onClick={() => setVideoRows([...videoRows, { url: '', name: '', stime: '', etime: '', valid: true }])}
                  style={{
                    width: 160,
                    padding: '10px 0',
                    fontSize: '1.05rem',
                    backgroundColor: '#fff',
                    color: '#4caf50',
                    border: '1.5px solid #4caf50',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px #b2ebf222',
                    transition: 'background 0.2s',
                    height: 44,
                    display: 'block',
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#e8f5e9')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  + 行追加
                </button>
                <div style={{ flex: 1 }} />
              </div>
            </div>
          )}

          <button onClick={handleSubmit} style={{ width: '100%', padding: '12px', fontSize: '1.1rem', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: 10, marginTop: 20, cursor: 'pointer', fontWeight: 'bold' }}>
            {isEditMode ? '更新する' : '作成する'}
          </button>
        </div>
      </div>
    </>
  );
}
