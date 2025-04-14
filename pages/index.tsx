// pages/index.tsx
import { useState } from 'react';

const images = [
  { id: 1, name: '고양이', url: '/cat.jpg' },
  { id: 2, name: '강아지', url: '/dog.jpg' }
];

export default function Home() {
  const [winner, setWinner] = useState<number | null>(null);

  const handleClick = async (id: number) => {
    setWinner(id);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>이상형 월드컵</h1>
      {winner === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '50px' }}>
          {images.map(img => (
            <div key={img.id} onClick={() => handleClick(img.id)}>
              <img src={img.url} alt={img.name} width="200" />
              <p>{img.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <h2>우승자는: {images.find(i => i.id === winner)?.name}</h2>
      )}
    </div>
  );
}