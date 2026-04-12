// pages/guide.tsx
import Header from '@/components/Header';
import Head from 'next/head';

export default function GuidePage() {
  return (
    <>
      <Head>
        <title>使い方ガイド | スキト - 好きトーナメント</title>
        <meta name="description" content="スキトの使い方を詳しく解説。ゲームの遊び方、作成方法、検索・フィルター機能、活用のヒントなどを紹介します。" />
        <meta name="keywords" content="スキト,使い方,ガイド,ゲーム作成,投票方法,検索機能,フィルター機能" />
        <meta property="og:title" content="使い方ガイド | スキト - 好きトーナメント" />
        <meta property="og:description" content="スキトの使い方を詳しく解説。ゲームの遊び方、作成方法、検索・フィルター機能、活用のヒントなどを紹介します。" />
        <meta property="og:url" content="https://sukito.net/guide" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://sukito.net/guide" />
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
            使い方ガイド
          </h1>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>ゲームの遊び方</h2>
            <div style={stepContainerStyle}>
              <div style={stepStyle}>
                <div style={stepNumberStyle}>1</div>
                <div style={stepContentStyle}>
                  <h4>ゲームを選択</h4>
                  <p>ホームページから興味のあるゲームをクリックして選択します。</p>
                </div>
              </div>
              <div style={stepStyle}>
                <div style={stepNumberStyle}>2</div>
                <div style={stepContentStyle}>
                  <h4>投票する</h4>
                  <p>表示された2つの選択肢から、より好きな方をクリックして投票します。</p>
                </div>
              </div>
              <div style={stepStyle}>
                <div style={stepNumberStyle}>3</div>
                <div style={stepContentStyle}>
                  <h4>結果を確認</h4>
                  <p>投票が完了すると、最終的な結果と統計情報を確認できます。</p>
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>ゲーム作成方法</h2>
            <div style={stepContainerStyle}>
              <div style={stepStyle}>
                <div style={stepNumberStyle}>1</div>
                <div style={stepContentStyle}>
                  <h4>作成ページに移動</h4>
                  <p>「ゲームを作成する」ボタンをクリックして作成ページに移動します。</p>
                </div>
              </div>
              <div style={stepStyle}>
                <div style={stepNumberStyle}>2</div>
                <div style={stepContentStyle}>
                  <h4>コンテンツをアップロード</h4>
                  <p>画像・動画・GIF・YouTubeリンクをアップロードします。最低4つ、最大16個まで追加可能です。</p>
                </div>
              </div>
              <div style={stepStyle}>
                <div style={stepNumberStyle}>3</div>
                <div style={stepContentStyle}>
                  <h4>タイトルと説明を入力</h4>
                  <p>ゲームのタイトルと説明を入力して、どのような投票ゲームかを明確にします。</p>
                </div>
              </div>
              <div style={stepStyle}>
                <div style={stepNumberStyle}>4</div>
                <div style={stepContentStyle}>
                  <h4>公開する</h4>
                  <p>「作成する」ボタンをクリックしてゲームを公開します。URLが生成されるので、友達と共有できます。</p>
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>検索とフィルター機能</h2>
            <div style={featureContainerStyle}>
              <div style={featureStyle}>
                <h4>検索機能</h4>
                <p>ゲームタイトルや説明文でキーワード検索ができます。</p>
              </div>
              <div style={featureStyle}>
                <h4>期間フィルター</h4>
                <p>すべて・月・週・日で期間を絞り込んでゲームを探せます。</p>
              </div>
              <div style={featureStyle}>
                <h4>タイプフィルター</h4>
                <p>画像・動画でコンテンツタイプを絞り込めます。</p>
              </div>
              <div style={featureStyle}>
                <h4>並び替え</h4>
                <p>人気順・新着順でゲームを並び替えることができます。</p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>活用のヒント</h2>
            <div style={tipContainerStyle}>
              <div style={tipStyle}>
                <h4>テーマを明確に</h4>
                <p>「好きなアニメキャラクター」「おすすめの食べ物」など、明確なテーマを設定すると投票しやすくなります。</p>
              </div>
              <div style={tipStyle}>
                <h4>SNSで共有</h4>
                <p>作成したゲームをTwitterやInstagramで共有して、多くの人に参加してもらいましょう。</p>
              </div>
              <div style={tipStyle}>
                <h4>高品質な画像</h4>
                <p>鮮明で見やすい画像や動画を使用すると、より魅力的なゲームになります。</p>
              </div>
              <div style={tipStyle}>
                <h4>分かりやすい説明</h4>
                <p>ゲームの目的や投票の基準を明確に説明すると、参加者が理解しやすくなります。</p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>注意事項</h2>
            <div style={warningContainerStyle}>
              <ul style={warningListStyle}>
                <li>著作権に注意して、適切なコンテンツをアップロードしてください</li>
                <li>不適切なコンテンツは削除される場合があります</li>
                <li>個人情報や機密情報は含めないでください</li>
                <li>他のユーザーを尊重し、マナーを守ってご利用ください</li>
              </ul>
            </div>
          </section>

          <div style={ctaContainerStyle}>
            <h3 style={{ marginBottom: '16px', color: '#4caf50' }}>今すぐ始めよう！</h3>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => window.location.href = '/make'} 
                style={ctaButtonStyle}
              >
                ゲームを作成する
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                style={secondaryButtonStyle}
              >
                ゲームを探す
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: '16px',
  borderLeft: '4px solid #4caf50',
  paddingLeft: '8px',
};

const stepContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const stepStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
};

const stepNumberStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#4caf50',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  flexShrink: 0,
};

const stepContentStyle: React.CSSProperties = {
  flex: 1,
};

const featureContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '16px',
};

const featureStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#e8f5e8',
  borderRadius: '8px',
  border: '1px solid #4caf50',
};

const tipContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '16px',
};

const tipStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#fff3cd',
  borderRadius: '8px',
  border: '1px solid #ffeaa7',
};

const warningContainerStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#f8d7da',
  borderRadius: '8px',
  border: '1px solid #f5c6cb',
};

const warningListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: '20px',
  color: '#721c24',
};

const ctaContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px',
  backgroundColor: '#f0f8ff',
  borderRadius: '8px',
  border: '1px solid #b0c4de',
};

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: '#4caf50',
  color: '#fff',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '1rem',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  color: '#4caf50',
  border: '2px solid #4caf50',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '1rem',
  cursor: 'pointer',
  fontWeight: 'bold',
}; 