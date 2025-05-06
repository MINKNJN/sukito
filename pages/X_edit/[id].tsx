import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Header from '@/components/Header';

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

interface EditPageProps {
  game: Game | null;
}

const EditPage: NextPage<EditPageProps> = ({ game }) => {
  const router = useRouter();

  const [title, setTitle] = useState(game?.title || '');
  const [desc, setDesc] = useState(game?.desc || '');
  const [items, setItems] = useState<GameItem[]>(game?.items || []);

  if (!game) {
    return (
      <>
        <Header />
        <div style={{ padding: 24 }}>
          <h1>존재하지 않는 게임입니다.</h1>
          <button onClick={() => router.push('/')}>목록으로</button>
        </div>
      </>
    );
  }

  const handleItemNameChange = (index: number, value: string) => {
    const updatedItems = [...items];
    updatedItems[index].name = value;
    setItems(updatedItems);
  };

  const handleItemDelete = (index: number) => {
    if (confirm('정말 이 아이템을 삭제하시겠습니까?')) {
      const updatedItems = [...items];
      updatedItems.splice(index, 1);
      setItems(updatedItems);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력하세요.');
      return;
    }
    if (items.length < 2) {
      alert('아이템이 2개 이상이어야 합니다.');
      return;
    }
    try {
      const res = await fetch('/api/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: game._id,
          title,
          desc,
          items,
        }),
      });
      if (res.ok) {
        alert('수정 완료!');
        router.push(`/play/${game._id}`);
      } else {
        alert('수정 실패');
      }
    } catch (err) {
      console.error(err);
      alert('네트워크 오류');
    }
  };

  return (
    <>
      <Header />
      <div style={{ padding: 24 }}>
        <h1>이상형 월드컵 수정</h1>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          style={{ width: '100%', marginBottom: 8 }}
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="설명"
          style={{ width: '100%', marginBottom: 8 }}
        />

        <h3>아이템 목록</h3>
        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                backgroundImage: `url(${item.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 6,
                marginRight: 8,
              }}
            />
            <input
              value={item.name}
              onChange={(e) => handleItemNameChange(index, e.target.value)}
              style={{ flex: 1, marginRight: 8 }}
            />
            <button onClick={() => handleItemDelete(index)} style={{ backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>
              삭제
            </button>
          </div>
        ))}

        <button
          onClick={handleSave}
          style={{ marginTop: 20, padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: 4 }}
        >
          저장하기
        </button>
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

    if (!game) {
      return { props: { game: null } };
    }

    return {
      props: {
        game: {
          _id: game._id.toString(),
          title: game.title,
          desc: game.desc,
          items: game.items.map((item: any) => ({
            name: item.name,
            url: item.url,
            type: (item.type || 'image') as 'image' | 'gif' | 'video' | 'youtube',
          })),
        },
      },
    };
  } catch (err) {
    console.error('에러 발생:', err);
    return { props: { game: null } };
  }
};

export default EditPage;
