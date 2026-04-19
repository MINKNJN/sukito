declare global {
  interface Window {
    dataLayer: any[];
    ttq: any;       // TikTok Pixel
    twq: any;       // X (Twitter) Pixel
    fbq: any;       // Meta (Facebook) Pixel
  }
}

const pushDataLayer = (event: Record<string, any>) => {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  } catch (e) {}
};

export const trackTournamentStart = (tournamentName: string, tournamentId: string, roundCount: number) => {
  // GTM dataLayer
  pushDataLayer({
    event: 'tournament_start',
    tournament_name: tournamentName,
    tournament_id: tournamentId,
    round_count: roundCount,
  });

  // 시작 시간 기록 (완료 시 소요 시간 계산용)
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('sukito_start_time', Date.now().toString());
    sessionStorage.setItem('sukito_tournament_name', tournamentName);
  }

  // TikTok: 게임 시작 = 콘텐츠 조회
  try { window.ttq?.track('ViewContent', { content_name: tournamentName }); } catch (e) {}

  // X: 게임 시작
  try { window.twq?.('event', 'tw-rbzh9-o7xio', {}); } catch (e) {}

  // Meta: 게임 시작 = 콘텐츠 조회
  try { window.fbq?.('track', 'ViewContent', { content_name: tournamentName }); } catch (e) {}
};

export const trackTournamentComplete = (tournamentName: string, tournamentId: string, winnerName: string) => {
  const startTime = typeof sessionStorage !== 'undefined'
    ? parseInt(sessionStorage.getItem('sukito_start_time') || '0')
    : 0;
  const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

  // GTM dataLayer
  pushDataLayer({
    event: 'tournament_complete',
    tournament_name: tournamentName,
    tournament_id: tournamentId,
    winner: winnerName,
    time_spent_seconds: timeSpent,
  });

  // TikTok: 완료 = 핵심 전환 이벤트
  try { window.ttq?.track('CompleteRegistration', { content_name: tournamentName, status: winnerName }); } catch (e) {}

  // X: 완료
  try { window.twq?.('event', 'tw-rbzh9-o7xip', {}); } catch (e) {}

  // Meta: 완료 = Lead (광고 AI 학습 핵심)
  try { window.fbq?.('track', 'Lead', { content_name: tournamentName, content_category: winnerName }); } catch (e) {}
};

export const trackResultShare = (platform: 'x' | 'facebook' | 'line' | 'link_copy', location: 'game_card' | 'result_page') => {
  const tournamentName = typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('sukito_tournament_name') || ''
    : '';

  // GTM dataLayer
  pushDataLayer({
    event: 'result_share',
    share_platform: platform,
    location,
    tournament_name: tournamentName,
  });

  // TikTok: 공유
  try { window.ttq?.track('Share', { content_name: tournamentName }); } catch (e) {}

  // Meta: 공유
  try { window.fbq?.('track', 'Share', { content_name: tournamentName }); } catch (e) {}
};
