// pages/about.tsx
import Header from '@/components/Header';
import Head from 'next/head';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>このサイトについて | スキト - 好きトーナメント</title>
        <meta name="description" content="スキトは画像・動画・GIF・YouTubeを使ってトーナメント形式の投票ゲームを作成・共有できる無料のエンタメプラットフォームです。" />
        <meta property="og:title" content="このサイトについて | スキト" />
        <meta property="og:url" content="https://sukito.net/about" />
        <link rel="canonical" href="https://sukito.net/about" />
      </Head>
      <Header />
      <div style={pageWrap}>
        <main style={card}>
          <h1 style={h1Style}>このサイトについて</h1>

          <section style={section}>
            <p style={lead}>
              「スキト」は、画像・動画・GIF・YouTubeリンクを使って、トーナメント形式の推し投票ゲームを誰でも無料で作成・共有できるサービスです。
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>主な特徴</h2>
            <ul style={ul}>
              <li>会員登録なしでゲームプレイ可能</li>
              <li>画像・GIF・動画・YouTube に対応</li>
              <li>投票結果と順位をリアルタイムで確認</li>
              <li>URLひとつで友達やSNSに共有</li>
              <li>スマートフォン対応</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>こんな方におすすめ</h2>
            <p>アニメ・アイドル・スポーツ・食べ物・動物など、ジャンルを問わず「自分の好きなものを紹介したい」「みんなに選んでもらいたい」と思っている方に最適なサービスです。</p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>投稿コンテンツについて</h2>
            <p>投稿されたゲームは管理者による審査を経て公開されます。著作権や肖像権を侵害するコンテンツ、不適切と判断されたコンテンツは非公開または削除される場合があります。</p>
          </section>

          <section style={{ ...section, marginBottom: 0 }}>
            <h2 style={sectionTitle}>お問い合わせ</h2>
            <p>
              ご意見・ご要望・バグ報告は以下のメールアドレスまでお気軽にどうぞ。<br />
              <strong>rankingood5@gmail.com</strong>
            </p>
          </section>

          <nav style={footerNav}>
            <a href="/guide" style={navLink}>使い方ガイド</a>
            <a href="/terms" style={navLink}>利用規約</a>
            <a href="/privacy" style={navLink}>プライバシーポリシー</a>
          </nav>
        </main>
      </div>
    </>
  );
}

const pageWrap: React.CSSProperties = {
  background: 'linear-gradient(120deg, #f8fafc 0%, #e6f7ff 100%)',
  minHeight: '100dvh',
  padding: '0 0 48px',
};

const card: React.CSSProperties = {
  maxWidth: 720,
  margin: '40px auto 0',
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  border: '1.5px solid #e0f7fa',
  padding: '40px 32px',
};

const h1Style: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#4caf50',
  letterSpacing: -0.5,
  textAlign: 'center',
  marginBottom: 32,
};

const section: React.CSSProperties = {
  marginBottom: 28,
};

const lead: React.CSSProperties = {
  fontSize: '1rem',
  lineHeight: 1.8,
  color: '#333',
  padding: '16px 20px',
  background: '#f0fdf4',
  borderRadius: 10,
  borderLeft: '4px solid #4caf50',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: '#2e7d32',
  marginBottom: 10,
  paddingLeft: 10,
  borderLeft: '3px solid #4caf50',
};

const ul: React.CSSProperties = {
  paddingLeft: 20,
  lineHeight: 1.9,
  color: '#444',
  margin: 0,
};

const footerNav: React.CSSProperties = {
  marginTop: 36,
  paddingTop: 20,
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  gap: 20,
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const navLink: React.CSSProperties = {
  color: '#1565c0',
  textDecoration: 'none',
  fontSize: '0.9rem',
};
