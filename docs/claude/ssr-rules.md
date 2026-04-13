# SSR / Hydration 규칙

## 절대 규칙

`window`, `localStorage`, `document`는 **반드시 `useEffect` 안에서만** 사용.

```ts
// ❌ 잘못된 예 — SSR에서 크래시
const isMobile = window.innerWidth < 600;

// ✅ 올바른 예
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  setIsMobile(window.innerWidth < 600);
}, []);
```

## SSR 블로킹 주의

`useState(true)` + `if (loading) return null` 패턴은 **SSR HTML을 완전히 비워버림**.

```ts
// ❌ OG태그, body 내용 전부 사라짐
const [loading, setLoading] = useState(true);
if (loading) return null;

// ✅ 초기값을 false로
const [loading, setLoading] = useState(false);
```

> 이 버그가 `play/[id].tsx`에서 실제로 발생했음 (2026-04-13 수정)

## 반응형 레이아웃

JS 기반 `isMobile` 대신 Bootstrap CSS 클래스 사용 권장.

```tsx
// ❌ SSR 불일치 발생 가능
<div style={{ flexDirection: isMobile ? 'column' : 'row' }}>

// ✅ CSS만으로 처리
<div className="col-12 col-md-6">
```

## dynamic import (클라이언트 전용 컴포넌트)

```ts
import dynamic from 'next/dynamic';
const HeavyComponent = dynamic(() => import('./HeavyComponent'), { ssr: false });
```

## getServerSideProps

`pages/play/[id].tsx`, `pages/index.tsx`에서 사용 중.
DB 쿼리는 여기서 수행하고, props로 컴포넌트에 전달.
`__NEXT_DATA__`에 JSON으로 삽입되어 클라이언트 hydration에 사용.
