// pages/privacy.tsx

import Header from '@/components/Header';

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <main style={{ padding: '40px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px', fontWeight: 700 }}>
          プライバシーポリシー
        </h1>

        <section style={{ marginBottom: '32px' }}>
          <p>
            本ウェブサイト（以下「当サイト」）は、利用者のプライバシーを尊重し、個人情報の保護に努めています。
            以下に当サイトのプライバシーポリシーを記載します。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>1. 個人情報の取得と利用目的</h2>
          <p>
            当サイトでは、広告配信やアクセス解析のために、クッキー（Cookie）などを使用してIPアドレスや閲覧履歴などの情報を取得することがあります。
            取得した情報は、以下の目的のために利用されます：
          </p>
          <ul style={ulStyle}>
            <li>利用者の利便性向上のための表示最適化</li>
            <li>サービス改善のためのアクセス解析</li>
            <li>第三者による広告配信</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>2. 広告について</h2>
          <p>
            当サイトは第三者配信の広告サービス「Google AdSense（グーグル アドセンス）」を利用しています。
            Googleなどの第三者広告配信事業者は、ユーザーの興味に応じた広告を表示するために、
            Cookie（クッキー）を使用することがあります。
          </p>
          <p>
            Googleによる広告で使用されるCookieについては、{' '}
            <a
              href="https://policies.google.com/technologies/ads?hl=ja"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              こちら
            </a>
            のページをご確認ください。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>3. アクセス解析ツールについて</h2>
          <p>
            当サイトでは、アクセス解析ツール（例：Google Analytics）は現在使用していません。
            将来的に導入される場合は、本ポリシーにて告知いたします。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>4. 個人情報の第三者提供</h2>
          <p>
            取得した個人情報は、法令に基づく場合を除き、第三者に提供することはありません。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>5. クッキーの無効化について</h2>
          <p>
            利用者は、ブラウザの設定を変更することで、クッキーの使用を無効にすることができます。
            ただし、その場合、当サイトの一部機能が利用できなくなる可能性があります。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>6. プライバシーポリシーの変更</h2>
          <p>
            本ポリシーは必要に応じて改定されることがあります。改定後は当ページにて速やかに公表いたします。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>7. お問い合わせ先</h2>
          <p>
            本ポリシーに関するお問い合わせは、以下のメールアドレスまでお願いいたします。<br />
            📧 <strong>rankingood5@gmail.com</strong>
          </p>
        </section>
      </main>
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

const linkStyle: React.CSSProperties = {
  color: '#1565c0',
  textDecoration: 'underline',
};
