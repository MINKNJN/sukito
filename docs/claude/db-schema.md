# DB 스키마

MongoDB DB명: `sukito`

## games

```js
{
  _id: ObjectId,
  title: string,
  desc: string,
  items: [{ itemId, name, url, type, thumbUrl? }],  // itemId: UUID v4 (안정 식별자, 이름·URL 변경에도 유지)
  itemsHistory: [...],                 // 이전 아이템 보존 (itemId 동일하게 유지)
  thumbnails: [{ name, url, type }],  // 대표 이미지
  visibility: 'public' | 'private' | 'password',
  password?: string,
  createdBy: string,                  // user nickname
  createdAt: Date,
  updatedAt: Date
}
```

## users

```js
{
  _id: ObjectId,
  nickname: string,
  email: string,
  password: string,   // bcrypt 해시
  role: 'user' | 'admin',
  createdAt: Date
}
```

## comments

```js
{
  _id: ObjectId,
  gameId: string,
  nickname: string,
  content: string,
  authorId: string,
  authorType: string,
  likes: number,
  dislikes: number,
  likeUsers: string[],
  dislikeUsers: string[],
  createdAt: Date
}
```

## records

```js
{
  _id: ObjectId,
  gameId: string,
  winnerName: string,
  winnerUrl: string,
  winnerItemId?: string,  // UUID — items.itemId 참조 (마이그레이션 후 전체 부여)
  playedAt: Date
}
```

## battles

```js
{
  _id: ObjectId,
  gameId: string,
  winnerName: string,
  winnerUrl: string,
  winnerItemId?: string,  // UUID — items.itemId 참조
  loserName: string,
  loserUrl: string,
  loserItemId?: string,   // UUID — items.itemId 참조
  playedAt: Date
}
```

## resume_games

```js
{
  _id: ObjectId,
  userId: string,
  gameId: string,
  selectedRound: number,
  currentRound: number,
  remainingItems: [...],
  winnerHistory: [...],
  lastSavedAt: Date
}
```

## 연결

`lib/mongodb.ts` — Connection Pooling 적용. `clientPromise`를 import해서 사용.

```ts
import clientPromise from '@/lib/mongodb';
const client = await clientPromise;
const db = client.db('sukito');
```
