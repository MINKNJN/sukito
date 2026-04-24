// pages/terms.tsx
import Header from '@/components/Header';
import Head from 'next/head';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>利用規約 | スキト - 好きトーナメント</title>
        <meta name="description" content="スキトの利用規約。サービスの利用条件・禁止事項・免責事項について説明します。" />
        <meta property="og:title" content="利用規約 | スキト" />
        <meta property="og:url" content="https://sukito.net/terms" />
        <link rel="canonical" href="https://sukito.net/terms" />
      </Head>
      <Header />
      <div style={pageWrap}>
        <main style={card}>
          <h1 style={h1Style}>利用規約</h1>

          <section style={section}>
            <p style={lead}>
              本利用規約（以下「本規約」）は、スキト（以下「当サイト」）が提供するサービス（以下「本サービス」）の利用条件を定めるものです。
              本サービスをご利用いただくことで、本規約に同意したものとみなされます。
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>1. 本サービスの内容</h2>
            <p>画像・動画・GIF・YouTubeリンクを使用したトーナメント型の投票ゲームを作成・閲覧・プレイできるサービスです。個人が趣味として楽しむことを目的としており、営利目的での使用は禁止されます。</p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>2. 禁止事項</h2>
            <ul style={ul}>
              <li>他者の著作権・肖像権を侵害する行為</li>
              <li>誹謗中傷・差別的・暴力的なコンテンツの投稿</li>
              <li>スパム・広告目的の利用</li>
              <li>不正アクセスやサービス運営を妨害する行為</li>
              <li>その他、当サイトが不適切と判断する行為</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>3. 知的財産権</h2>
            <p>本サービス内のコンテンツの著作権は、当サイトまたは各権利者に帰属します。無断転載・転用・二次配布は禁止されています。</p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>4. 免責事項</h2>
            <p>当サイトは掲載情報の正確性・完全性を保証しません。本サービスの利用により生じた損害について、一切の責任を負いません。ユーザー間のトラブルへの関与もいたしません。</p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>5. 規約の変更</h2>
            <p>本規約は予告なく変更されることがあります。変更後も本サービスを継続して利用した場合、変更後の規約に同意したものとみなされます。</p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>6. 準拠法および管轄</h2>
            <p>本規約の解釈・適用は日本法に準拠し、紛争が生じた場合は東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </section>

          <section style={{ ...section, marginBottom: 0 }}>
            <h2 style={sectionTitle}>7. お問い合わせ</h2>
            <p>
              本規約に関するお問い合わせはこちらまで。<br />
              <strong>rankingood5@gmail.com</strong>
            </p>
          </section>

          <nav style={footerNav}>
            <a href="/about" style={navLink}>このサイトについて</a>
            <a href="/guide" style={navLink}>使い方ガイド</a>
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
  marginBottom: 24,
};

const lead: React.CSSProperties = {
  fontSize: '0.95rem',
  lineHeight: 1.8,
  color: '#444',
  padding: '14px 18px',
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
