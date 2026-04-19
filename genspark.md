Sukito.net 마케팅 추적 시스템 구축 - VSC 개발자 전달용 프롬프트
아래 내용을 복사해서 그대로 전달하세요
# Sukito.net 마케팅 추적 시스템 구축 요청

## 프로젝트 배경 및 목표
sukito.net은 이상형 월드컵(토너먼트 게임) 사이트로, 일본 시장을 대상으로 
TikTok, X(트위터), Instagram, YouTube에서 광고를 집행할 예정입니다.

광고 성과를 정확히 측정하고 각 플랫폼의 AI 최적화를 위해
통합 마케팅 추적 시스템을 구축해야 합니다.

---

## 전체 시스템 아키텍처 이해

### 데이터 흐름 구조
일본 유저가 SNS 광고 클릭 ↓ (UTM + 플랫폼 클릭ID 자동 추가) sukito.net 접속 ↓ (게임 플레이 중 중요 행동 발생) JavaScript → dataLayer 이벤트 기록 ↓ (GTM이 감지) GTM → 모든 플랫폼에 동시 분배 ├── GA4 (UTM 기반 플랫폼별 성과 비교) ├── TikTok 픽셀 (AI 최적화) ├── X 픽셀 (AI 최적화) └── Meta 픽셀 (AI 최적화)


### 각 구성요소 역할
- **GTM**: 모든 추적 코드의 중앙 관리자 (sukito.net에는 GTM 코드만 설치)
- **dataLayer**: sukito.net에서 게임 이벤트를 GTM에 전달하는 내부 메신저
- **GA4**: UTM 파라미터로 플랫폼별 성과를 중립적으로 비교 분석
- **각 SNS 픽셀**: 플랫폼별 AI가 "어떤 일본인에게 더 광고를 보여줄지" 학습

---

## 현재 완료 상태
✅ GA4 계정 생성 및 sukito.net 연동 완료
✅ GTM 계정 생성 및 컨테이너 ID 발급 완료  
✅ sukito.net에 GTM 코드 설치 완료
    - <head> 최상단에 GTM 스크립트
    - <body> 시작 부분에 noscript 태그

---

## 개발 작업 요청사항

### 작업 1: 기존 GA4 gtag 코드 완전 제거 (최우선)
⚠️ 매우 중요: GTM과 기존 gtag가 동시에 존재하면 GA4에서 모든 데이터가 2배로 중복 집계됩니다.

아래 형태의 코드를 프로젝트 전체에서 찾아서 완전히 삭제해 주세요:

```html
<!-- 삭제 대상 코드 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
작업 2: dataLayer 이벤트 추적 시스템 구현
적절한 위치(예: src/utils/tracking.js)에 아래 추적 함수들을 구현해 주세요:

// dataLayer 안전 초기화
window.dataLayer = window.dataLayer || [];

/**
 * 1. 토너먼트 시작 추적
 * 호출 시점: 유저가 게임 시작 버튼을 클릭했을 때
 */
export const trackTournamentStart = (tournamentName, category) => {
  window.dataLayer.push({
    event: 'tournament_start',
    tournament_name: tournamentName,      // 예: 'アニメキャラ最強決定戦'
    tournament_category: category         // 예: 'anime'
  });
  console.log('[Tracking] Tournament Start:', tournamentName, category);
};

/**
 * 2. 라운드 진행 추적 (선택사항)
 * 호출 시점: 유저가 각 라운드에서 선택을 완료했을 때
 */
export const trackRoundComplete = (roundNumber, totalRounds) => {
  window.dataLayer.push({
    event: 'round_complete',
    round_number: roundNumber,
    total_rounds: totalRounds,
    progress_rate: Math.round((roundNumber / totalRounds) * 100)
  });
  console.log('[Tracking] Round Complete:', roundNumber, '/', totalRounds);
};

/**
 * 3. 토너먼트 완료 추적 (핵심 전환 이벤트)
 * 호출 시점: 최종 우승자가 결정되고 결과 화면이 표시될 때
 * 이 이벤트가 각 SNS 픽셀의 AI 학습에 가장 중요하게 활용됩니다
 */
export const trackTournamentComplete = (tournamentName, winner, timeSpentSeconds) => {
  window.dataLayer.push({
    event: 'tournament_complete',
    tournament_name: tournamentName,
    winner: winner,                       // 예: '宮水三葉'
    time_spent_seconds: timeSpentSeconds
  });
  console.log('[Tracking] Tournament Complete:', winner, timeSpentSeconds + 'sec');
};

/**
 * 4. SNS 결과 공유 추적 (일본 시장에서 매우 중요)
 * 호출 시점: 유저가 결과 공유 버튼을 클릭했을 때
 */
export const trackResultShare = (platform, tournamentName) => {
  window.dataLayer.push({
    event: 'result_share',
    share_platform: platform,            // 'x', 'line', 'instagram', '_link'
    tournament_name: tournamentName
  });
  console.log('[Tracking] Result Share:', platform, tournamentName);
};

/**
 * 5. 가상 페이지뷰 (SPA 구조인 경우 필수)
 * 호출 시점: React/Vue 등에서 라우트가 변경될 때
 */
export const trackPageView = (pagePath, pageTitle) => {
  window.dataLayer.push({
    event: 'page_view',
    page_path: pagePath,
    page_title: pageTitle
  });
  console.log('[Tracking] Page View:', pagePath);
};

작업 3: 게임 로직에 추적 함수 연결
기존 게임 로직을 수정하지 않고, 아래 시점에 추적 함수 호출을 추가해 주세요:

// 게임 시작 버튼 클릭 시
function handleGameStart() {
  // 기존 게임 시작 로직
  startTournament();
  
  // 게임 시작 시간 기록 (완료 시간 계산용)
  window.gameStartTime = Date.now();
  
  // 추적 이벤트 호출
  trackTournamentStart('アニメキャラ最強決定戦', 'anime');
}

// 각 라운드 완료 시 (선택사항)
function handleRoundComplete(currentRound, totalRounds) {
  // 기존 라운드 진행 로직
  proceedToNextRound();
  
  // 추적 이벤트 호출
  trackRoundComplete(currentRound, totalRounds);
}

// 최종 결과 표시 시 (가장 중요!)
function showTournamentResult(winner) {
  // 게임 소요 시간 계산
  const timeSpent = Math.floor((Date.now() - window.gameStartTime) / 1000);
  
  // 기존 결과 표시 로직
  displayResult(winner);
  
  // 추적 이벤트 호출 (핵심 전환 이벤트)
  trackTournamentComplete('アニメキャラ最強決定戦', winner, timeSpent);
}

// SNS 공유 버튼 클릭 시 (일본 시장 특화)
function handleShareToX() {
  shareToTwitter();
  trackResultShare('x', 'アニメキャラ最強決定戦');
}

function handleShareToLine() {
  shareToLine(); // 일본에서 가장 중요한 공유 채널
  trackResultShare('line', 'アニメキャラ最強決定戦');
}

function handleShareToInstagram() {
  shareToInstagram();
  trackResultShare('instagram', 'アニメキャラ最強決定戦');
}

function handleLink() {
  LinkToClipboard();
  trackResultShare('_link', 'アニメキャラ最強決定戦');
}

중요한 주의사항
이벤트 이름은 절대 변경하지 마세요

'tournament_start', 'tournament_complete' 등은 GTM 설정과 정확히 일치해야 합니다
오타나 대소문자 차이도 추적 실패의 원인이 됩니다
기존 게임 로직은 수정하지 말고 추가만 하세요

기존 함수 호출 후에 tracking 함수를 추가하는 방식으로 구현
게임 동작에 영향을 주면 안 됩니다
에러 방어 처리 포함

tracking 함수에서 에러가 발생해도 게임은 정상 동작해야 합니다
try-catch 또는 존재 여부 확인 로직 포함
일본 시장 특화 고려사항

LINE 공유는 일본에서 90% 이상 이용률을 가진 핵심 채널입니다
토너먼트 이름은 일본어로 설정 (예: 'アニメキャラ最強決定戦')
작업 완료 후 검증 방법
검증 1: dataLayer 동작 확인
브라우저 개발자 도구(F12) → Console 탭에서 입력:

window.dataLayer
→ 배열 형태로 이벤트 객체들이 출력되면 정상

검증 2: 실제 게임 플레이 테스트
게임 시작 → Console에서 "[Tracking] Tournament Start" 로그 확인
각 라운드 진행 → Console에서 "[Tracking] Round Complete" 로그 확인
게임 완료 → Console에서 "[Tracking] Tournament Complete" 로그 확인
공유 버튼 클릭 → Console에서 "[Tracking] Result Share" 로그 확인
검증 3: 이벤트 순서 확인
dataLayer 배열에 다음 순서로 이벤트가 쌓이는지 확인:

tournament_start → round_complete(여러번) → tournament_complete → result_share
사전 조사 필요사항
구현 시작 전에 다음 정보를 확인해 주세요:

현재 기술 스택: React/Vue/Next.js/바닐라 JS 중 어떤 것을 사용하는지
게임 로직 파일 위치: 시작/완료/공유 버튼이 있는 컴포넌트 파일
기존 GA4 코드 위치: 어느 파일에 gtag 코드가 설치되어 있는지
현재 공유 기능: X, LINE, Instagram 공유 버튼 구현 상태
작업 완료 후 기대 효과
이 작업이 완료되면:

GA4에서 "TikTok vs Instagram vs X 중 어느 광고가 실제 게임 완료로 이어지는가"를 정확히 분석 가능
각 SNS 플랫폼의 AI가 "게임을 좋아하는 일본인 특성"을 학습하여 광고 효율 자동 향상
같은 광고비로 2-3배 많은 실제 게임 참여자 확보 가능
LINE을 통한 자연 바이럴 효과 측정 및 최적화 가능
현재 sukito.net의 프로젝트 구조를 파악하고 가장 적합한 방식으로 구현해 주세요.


---

## **추가 전달 정보**

**VSC 작업 전에 미리 파악해서 함께 알려주면 좋은 정보:**

현재 sukito.net의 기술 스택 (React/Vue/Next.js 등)
게임 시작 버튼이 있는 컴포넌트/파일명
게임 완료 시 결과를 표시하는 컴포넌트/파일명
SNS 공유 버튼이 구현된 위치
기존 GA4 gtag 코드가 설치된 파일 위치

이 정보를 프롬프트와 함께 전달하면 개발자가 더 정확하고 효율적으로 작업할 수 있습니다. 특히 일본 시장의 특성상 LINE 공유 기능의 중요성을 강조하여, 해당 기능이 없다면 추가 구현을 요청하는 것이 좋습니다.

---

# sukito.net 전용 구현 가이드

> genspark에서 작성한 범용 프롬프트를 sukito 프로젝트 구조에 맞게 구체화한 실행 문서입니다.

---

## 현재 완료 상태 (코드 반영 기준)

| 항목 | 상태 | 파일 |
|------|------|------|
| GTM 스크립트 설치 (`<head>` 최상단) | ✅ 완료 | `pages/_document.tsx` |
| GTM noscript (`<body>` 직후) | ✅ 완료 | `pages/_document.tsx` |
| 기존 GA4 gtag 직접 스크립트 제거 | ✅ 완료 | `pages/_document.tsx` |
| dataLayer 추적 함수 구현 | ⬜ 미완료 | `lib/tracking.ts` (신규 생성 필요) |
| 게임 시작 이벤트 연결 | ⬜ 미완료 | `pages/play/[id].tsx` |
| 게임 완료 이벤트 연결 | ⬜ 미완료 | `pages/play/[id].tsx` |
| 공유 이벤트 연결 | ⬜ 미완료 | `components/GameCard.tsx`, `pages/result.tsx` |

---

## sukito 기술 스택

- **프레임워크**: Next.js 15 + React 19 + TypeScript
- **라우팅**: Next.js Pages Router (`pages/` 디렉토리)
- **게임 플레이**: `pages/play/[id].tsx` (SSR + 클라이언트 상태)
- **결과 페이지**: `pages/result.tsx` (SSR)
- **게임 카드 (홈)**: `components/GameCard.tsx`

---

## 이벤트 발생 위치 (코드 레벨 정확한 위치)

### 이벤트 1: `tournament_start` — 게임 시작

**파일**: `pages/play/[id].tsx`
**함수**: `startTournament()` (약 154번째 줄)
**현재 코드**:
```typescript
const startTournament = () => {
  // ...라운드 세팅 로직...
  setIsPlaying(true);  // ← 이 줄 바로 앞에 추가
};
```
**추가할 코드**:
```typescript
const startTournament = () => {
  // ...기존 로직 그대로...
  setIsPlaying(true);

  // 추적 이벤트 추가 (게임 동작에 영향 없음)
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'tournament_start',
      tournament_name: game.title,   // DB에 저장된 실제 게임 제목 (일본어)
      tournament_id: game._id,
      round_count: selectedRound,
    });
  } catch (e) {}
};
```

---

### 이벤트 2: `tournament_complete` — 게임 완료 (가장 중요)

**파일**: `pages/play/[id].tsx`
**함수**: `handleSelect()` 내부 (약 202번째 줄)
**현재 코드**:
```typescript
if (newAdvancing.length === 1) {
  // ...API 기록 및 localStorage 저장...
  localStorage.removeItem('sukito_game');
  router.push(`/result?id=${game._id}`);  // ← 이 줄 바로 앞에 추가
  return;
}
```
**추가할 코드**:
```typescript
if (newAdvancing.length === 1) {
  // ...기존 로직 그대로...

  // 추적 이벤트 추가
  try {
    const startTime = parseInt(sessionStorage.getItem('sukito_start_time') || '0');
    const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'tournament_complete',
      tournament_name: game.title,
      tournament_id: game._id,
      winner: winner.name,
      time_spent_seconds: timeSpent,
    });
  } catch (e) {}

  localStorage.removeItem('sukito_game');
  router.push(`/result?id=${game._id}`);
  return;
}
```
> `sessionStorage.getItem('sukito_start_time')`은 `startTournament()`에서 `sessionStorage.setItem('sukito_start_time', Date.now().toString())` 로 저장해둬야 합니다.

---

### 이벤트 3: `result_share` — SNS 공유

공유 버튼은 두 곳에 있습니다.

#### 3-A. `components/GameCard.tsx` (홈 게임 카드에서 공유)

```typescript
const shareToTwitter = () => {
  // 기존 로직
  window.open(`https://twitter.com/intent/tweet?...`, '_blank');
  // 추적 추가
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'result_share', share_platform: 'x', location: 'game_card' });
  } catch (e) {}
};

const shareToLine = () => {
  window.open(`https://social-plugins.line.me/...`, '_blank');
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'result_share', share_platform: 'line', location: 'game_card' });
  } catch (e) {}
};

const shareToFacebook = () => {
  window.open(`https://www.facebook.com/...`, '_blank');
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'result_share', share_platform: 'facebook', location: 'game_card' });
  } catch (e) {}
};

const copyLink = async () => {
  await navigator.clipboard.writeText(shareUrl);
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'result_share', share_platform: 'link_copy', location: 'game_card' });
  } catch (e) {}
};
```

#### 3-B. `pages/result.tsx` (결과 페이지에서 공유)

동일한 패턴으로 `location: 'result_page'`로 구분하여 추가합니다.

---

## GTM 콘솔에서 해야 할 설정 (코드 작업 완료 후)

코드에서 dataLayer에 이벤트를 쌓으면, GTM에서 그것을 받아서 각 플랫폼에 전달합니다.

### 설정 순서

#### Step 1. GA4 연결
1. GTM 콘솔 → 태그 → 새로 만들기
2. 태그 유형: **Google 애널리틱스: GA4 이벤트**
3. 측정 ID: `G-DB9B3337QF`
4. 트리거: **All Pages** (페이지뷰 자동 추적)
5. 저장 → 게시

#### Step 2. GA4 맞춤 이벤트 연결 (각각 태그 생성)

| 태그 이름 | 이벤트 이름 | 트리거 |
|-----------|-------------|--------|
| GA4 - tournament_start | tournament_start | 맞춤 이벤트: `tournament_start` |
| GA4 - tournament_complete | tournament_complete | 맞춤 이벤트: `tournament_complete` |
| GA4 - result_share | result_share | 맞춤 이벤트: `result_share` |

#### Step 3. TikTok 픽셀 (광고 집행 전 필수)
1. TikTok 픽셀 ID 발급 후 GTM에 태그 추가
2. 이벤트 매핑: `tournament_complete` → TikTok `CompleteRegistration`

#### Step 4. X(트위터) 픽셀 (광고 집행 전 필수)
1. X Ads → 이벤트 매니저에서 픽셀 ID 발급
2. GTM에서 `tournament_complete` → X `Sign Up`

---

## 검증 방법 (코드 배포 후)

### 브라우저에서 바로 확인
1. sukito.net/play/아무게임ID 접속
2. F12 → Console 탭에서 입력:
```js
window.dataLayer
```
3. 게임 시작 버튼 클릭 → `tournament_start` 객체가 배열에 추가되는지 확인
4. 게임 완료 → `tournament_complete` 객체 확인
5. 공유 버튼 클릭 → `result_share` 객체 확인

### GTM Preview 모드로 확인
1. GTM 콘솔 → 미리보기 클릭
2. sukito.net 열면 GTM 디버거 패널이 하단에 표시
3. 게임 플레이하면서 이벤트가 "Tags Fired"에 표시되는지 확인

---

## 다음 단계 전체 로드맵

```
[현재 여기]
✅ GTM 코드 설치 완료
✅ GA4 직접 스크립트 제거 완료

[다음 - 코드 작업]
⬜ 작업 2: lib/tracking.ts 생성 (dataLayer 유틸 함수)
⬜ 작업 3: pages/play/[id].tsx에 이벤트 연결
⬜ 작업 4: components/GameCard.tsx에 공유 이벤트 연결
⬜ 작업 5: pages/result.tsx에 공유 이벤트 연결

[코드 배포 후 - GTM 콘솔 작업]
⬜ GTM에서 GA4 구성 태그 생성 및 게시
⬜ GA4에서 맞춤 이벤트 3개 확인
⬜ TikTok 픽셀 ID 발급 → GTM 태그 추가
⬜ X(트위터) 픽셀 ID 발급 → GTM 태그 추가
⬜ Meta(Instagram) 픽셀 ID 발급 → GTM 태그 추가

[광고 집행 준비]
⬜ UTM 파라미터 템플릿 작성 (플랫폼별)
⬜ 광고 소재 제작
⬜ 각 플랫폼 캠페인 생성 (전환 이벤트: tournament_complete)
⬜ 데이터 충분히 쌓인 후 (약 50건) 최적화 시작
```

---

## 주의사항

- **이벤트 이름 철자** `tournament_start`, `tournament_complete`, `result_share` — GTM과 코드가 정확히 일치해야 합니다 (대소문자 포함)
- **TypeScript 타입 오류** `window.dataLayer`는 `any[]` 타입으로 전역 선언 필요. `lib/tracking.ts` 상단에 `declare global { interface Window { dataLayer: any[] } }` 추가 필요
- **GA4 이중 추적 방지** GTM에서 GA4 태그 추가 전까지는 GA4에 데이터가 들어오지 않습니다. GTM 태그 게시 전에 미리보기로 검증 필수