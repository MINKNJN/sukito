// pages/guide.tsx
import Header from '@/components/Header';
import Head from 'next/head';

export default function GuidePage() {
  return (
    <>
      <Head>
        <title>使い方ガイド | スキト - 好きトーナメント</title>
        <meta name="description" content="スキトの使い方ガイド。ゲームの遊び方・作成方法・検索機能を解説します。" />
        <meta property="og:title" content="使い方ガイド | スキト" />
        <meta property="og:url" content="https://sukito.net/guide" />
        <link rel="canonical" href="https://sukito.net/guide" />
      </Head>
      <Header />
      <div style={pageWrap}>
        <main style={card}>
          <h1 style={h1Style}>使い方ガイド</h1>

          <section style={section}>
            <h2 style={sectionTitle}>ゲームの遊び方</h2>
            <div style={stepList}>
              <Step n={1} title="ゲームを選ぶ" desc="ホーム画面から気になるゲームを選んで「スタート」をタップ。" />
              <Step n={2} title="投票する" desc="表示された2枚の中から好きな方をタップ。これを繰り返して優勝者を決めます。" />
              <Step n={3} title="結果を確認" desc="トーナメント終了後、優勝者と総合ランキングを確認できます。SNSでシェアも可能です。" />
            </div>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>ゲームの作り方</h2>
            <p style={note}>ゲーム作成には無料の会員登録が必要です。</p>
            <div style={stepList}>
              <Step n={1} title="作成ページへ移動" desc="ヘッダーのメニューから「トーナメント作る」を選択します。" />
              <Step n={2} title="タイトルと説明を入力" desc="ゲームのテーマが伝わるタイトルと簡単な説明を入力します。" />
              <Step n={3} title="コンテンツをアップロード" desc="画像・GIF・動画・YouTubeリンクを最低4つ以上追加します。" />
              <Step n={4} title="申請する" desc="「作成する」ボタンを押すと審査リクエストが送信されます。管理者の承認後、ホームに公開されます。" />
            </div>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>検索・フィルター機能</h2>
            <div style={featureGrid}>
              <FeatureCard title="キーワード検索" desc="タイトルや説明文でゲームを検索できます。" />
              <FeatureCard title="タイプ絞り込み" desc="「画像」「動画」でコンテンツの種類を絞り込めます。" />
              <FeatureCard title="並び替え" desc="「人気順」「新着順」で表示順を切り替えられます。" />
            </div>
          </section>

          <section style={{ ...section, marginBottom: 0 }}>
            <h2 style={sectionTitle}>ご利用上の注意</h2>
            <ul style={ul}>
              <li>著作権・肖像権を侵害するコンテンツは投稿しないでください</li>
              <li>誹謗中傷・差別的な表現を含むゲームは削除されます</li>
              <li>個人情報はコンテンツに含めないようにしてください</li>
              <li>他のユーザーへの配慮をお願いします</li>
            </ul>
          </section>

          <div style={cta}>
            <a href="/make" style={ctaBtn}>ゲームを作成する</a>
            <a href="/" style={ctaBtnSecondary}>ゲームを探す</a>
          </div>

          <nav style={footerNav}>
            <a href="/about" style={navLink}>このサイトについて</a>
            <a href="/terms" style={navLink}>利用規約</a>
            <a href="/privacy" style={navLink}>プライバシーポリシー</a>
          </nav>
        </main>
      </div>
    </>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div style={stepRow}>
      <div style={stepNum}>{n}</div>
      <div>
        <div style={stepTitle}>{title}</div>
        <div style={stepDesc}>{desc}</div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={featureCard}>
      <div style={featureTitle}>{title}</div>
      <div style={featureDesc}>{desc}</div>
    </div>
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
  marginBottom: 32,
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: '#2e7d32',
  marginBottom: 14,
  paddingLeft: 10,
  borderLeft: '3px solid #4caf50',
};

const note: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#666',
  marginBottom: 12,
  paddingLeft: 4,
};

const stepList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const stepRow: React.CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
  padding: '14px 16px',
  background: '#f8fafc',
  borderRadius: 10,
  border: '1px solid #e9ecef',
};

const stepNum: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: '#4caf50',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '0.85rem',
  flexShrink: 0,
  marginTop: 1,
};

const stepTitle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.95rem',
  marginBottom: 4,
  color: '#222',
};

const stepDesc: React.CSSProperties = {
  fontSize: '0.88rem',
  color: '#555',
  lineHeight: 1.6,
};

const featureGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

const featureCard: React.CSSProperties = {
  padding: '14px 16px',
  background: '#f0fdf4',
  borderRadius: 10,
  border: '1px solid #c8e6c9',
};

const featureTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '0.9rem',
  color: '#2e7d32',
  marginBottom: 4,
};

const featureDesc: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#444',
  lineHeight: 1.5,
};

const ul: React.CSSProperties = {
  paddingLeft: 20,
  lineHeight: 1.9,
  color: '#444',
  margin: 0,
};

const cta: React.CSSProperties = {
  marginTop: 32,
  display: 'flex',
  gap: 12,
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const ctaBtn: React.CSSProperties = {
  display: 'inline-block',
  background: '#4caf50',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 24px',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: '0.95rem',
};

const ctaBtnSecondary: React.CSSProperties = {
  display: 'inline-block',
  background: '#fff',
  color: '#4caf50',
  textDecoration: 'none',
  padding: '10px 24px',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: '0.95rem',
  border: '2px solid #4caf50',
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
