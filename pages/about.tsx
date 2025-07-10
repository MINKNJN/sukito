// pages/about.tsx

import Header from '@/components/Header';

export default function AboutPage() {
  return (
    <>
      <Header />
      <div style={{ background: 'linear-gradient(120deg, #f8fafc 0%, #e6f7ff 100%)', minHeight: '100dvh', width: '100vw', padding: 0, margin: 0 }}>
        <main style={{
          maxWidth: 800,
          margin: '48px auto 0 auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 24px #b2ebf222',
          border: '1.5px solid #e0f7fa',
          padding: '40px 24px',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '24px', fontWeight: 700, color: '#4caf50', letterSpacing: -1, textAlign: 'center', fontFamily: 'inherit' }}>
            このサイトについて
          </h1>

          <section style={{ marginBottom: '32px' }}>
            <p>
              「スキト」は、ユーザーが自由に画像・動画・GIF・YouTubeリンクを使って、トーナメント形式の“推し投票”ゲームを作成・共有できる無料のウェブサービスです。
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>1. サイトの目的</h2>
            <p>
              本サイトは、エンタメ・カルチャー・趣味の分野において「好き」を共有することを目的としています。
              誰でも簡単にゲームを作成し、自分の理想や推しを他の人と楽しく比べ合うことができます。
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>2. 主な機能</h2>
            <ul style={ulStyle}>
              <li>画像・動画・GIF・YouTubeリンクを使ったトーナメント形式の投票ゲーム作成</li>
              <li>ゲームをURLで共有し、他のユーザーと楽しむ</li>
              <li>人気順・新着順の並び替え、検索、フィルター機能</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>3. 対象ユーザー</h2>
            <p>
              アニメ、スポーツ、動物、歌、ダンスなど、ジャンルを問わず「自分の好きなものを紹介したい」「皆に選んでもらいたい」と思っている方に最適なサービスです。
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>4. ご利用方法</h2>
            <p>
              会員登録なしでもプレイが可能です。ゲーム作成やコメント機能など一部の機能を利用するには、無料の会員登録が必要です。
              投稿されたコンテンツは管理者により確認され、不適切なものは削除される場合があります。
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>5. お問い合わせ</h2>
            <p>
              ご意見・ご要望・ご質問などがありましたら、以下のメールアドレスまでお気軽にご連絡ください。<br />
              📧 <strong>rankingood5@gmail.com</strong>
            </p>
          </section>
        </main>
      </div>
    </>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: '12px',
  borderLeft: '4px solid #4caf50',
  paddingLeft: '8px',
};

const ulStyle: React.CSSProperties = {
  paddingLeft: '20px',
  lineHeight: '1.6',
};
