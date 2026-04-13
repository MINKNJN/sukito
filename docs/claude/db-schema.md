# DB 스키마

MongoDB DB명: `sukito`

## games

```js
{
  _id: ObjectId,
  title: string,
  desc: string,
  items: [{ name, url, type }],       // 토너먼트 참가 아이템
  itemsHistory: [...],                 // 이전 아이템 보존
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
