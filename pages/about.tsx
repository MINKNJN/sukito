// pages/about.tsx

import Header from '@/components/Header';
import Head from 'next/head';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>このサイトについて | スキト - 好きトーナメント</title>
        <meta name="description" content="スキトは画像・動画・GIF・YouTubeを使ってトーナメント形式の投票ゲームを作成・共有できる無料のエンタメプラットフォームです。アニメ、アイドル、スポーツなど様々なジャンルの推し投票を楽しめます。" />
        <meta name="keywords" content="スキト,投票ゲーム,トーナメント,エンタメ,アニメ,アイドル,スポーツ,推し投票,無料ゲーム" />
        <meta property="og:title" content="このサイトについて | スキト - 好きトーナメント" />
        <meta property="og:description" content="スキトは画像・動画・GIF・YouTubeを使ってトーナメント形式の投票ゲームを作成・共有できる無料のエンタメプラットフォームです。" />
        <meta property="og:url" content="https://sukito.net/about" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://sukito.net/about" />
      </Head>
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
            <p style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <strong>🎯 主な特徴：</strong><br />
              • 無料で利用可能<br />
              • 会員登録不要でゲームプレイ可能<br />
              • 画像・動画・GIF・YouTube対応<br />
              • リアルタイム投票結果<br />
              • モバイル対応
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>2. 主な機能</h2>
            <ul style={ulStyle}>
              <li>画像・動画・GIF・YouTubeリンクを使ったトーナメント形式の投票ゲーム作成</li>
              <li>ゲームをURLで共有し、他のユーザーと楽しむ</li>
              <li>人気順・新着順の並び替え、検索、フィルター機能</li>
              <li>リアルタイム投票結果と統計表示</li>
              <li>コメント機能でユーザー同士の交流</li>
              <li>レスポンシブデザインでスマートフォン対応</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>3. 対象ユーザー</h2>
            <p>
              アニメ、スポーツ、動物、歌、ダンスなど、ジャンルを問わず「自分の好きなものを紹介したい」「皆に選んでもらいたい」と思っている方に最適なサービスです。
            </p>
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: '8px',
              border: '1px solid #4caf50'
            }}>
              <h4 style={{ marginBottom: '8px', color: '#2e7d32' }}>🎮 こんな方におすすめ：</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>アニメやアイドルのファン</li>
                <li>スポーツ選手のファン</li>
                <li>音楽やダンスが好きな方</li>
                <li>動物やペットが好きな方</li>
                <li>食べ物や料理が好きな方</li>
                <li>ゲームやエンタメが好きな方</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>4. ご利用方法</h2>
            <div style={{ 
              backgroundColor: '#f0f8ff', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #b0c4de'
            }}>
              <h4 style={{ marginBottom: '12px', color: '#2c5aa0' }}>📱 簡単3ステップ：</h4>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>ゲーム作成：</strong>画像・動画・GIFをアップロードしてトーナメントを作成</li>
                <li><strong>共有：</strong>生成されたURLを友達やSNSで共有</li>
                <li><strong>投票：</strong>他のユーザーが投票して結果を確認</li>
              </ol>
            </div>
            <p style={{ marginTop: '16px' }}>
              会員登録なしでもプレイが可能です。ゲーム作成やコメント機能など一部の機能を利用するには、無料の会員登録が必要です。
              投稿されたコンテンツは管理者により確認され、不適切なものは削除される場合があります。
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>5. プライバシーとセキュリティ</h2>
            <p>
              当サイトでは、ユーザーのプライバシーを尊重し、個人情報の適切な管理を行っています。
              詳細については<a href="/privacy" style={{ color: '#1565c0', textDecoration: 'none' }}>プライバシーポリシー</a>をご確認ください。
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>6. お問い合わせ</h2>
            <p>
              ご意見・ご要望・ご質問などがありましたら、以下のメールアドレスまでお気軽にご連絡ください。<br />
              📧 <strong>rankingood5@gmail.com</strong>
            </p>
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '6px',
              border: '1px solid #ffeaa7'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404' }}>
                💡 改善提案やバグ報告も歓迎しています。より良いサービスにするためにご協力をお願いします。
              </p>
            </div>
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
