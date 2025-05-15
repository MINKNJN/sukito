// pages/terms.tsx

import Header from '@/components/Header';

export default function TermsPage() {
  return (
    <>
      <Header />

      <main style={{ padding: '40px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px', fontWeight: 700 }}>
          利用規約
        </h1>

        <section style={{ marginBottom: '32px' }}>
          <p>
            本利用規約（以下「本規約」）は、当サイト「スキト」（以下「当サイト」）が提供するサービス（以下「本サービス」）の利用条件を定めるものです。
            利用者の皆様（以下「ユーザー」）には、本規約に従って本サービスをご利用いただきます。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>1. 本サービスの内容</h2>
          <p>
            当サイトは、画像・動画・GIF・YouTubeリンクを使用したトーナメント型の投票ゲームを作成・閲覧・参加できるサービスを提供します。
            本サービスは、個人が趣味として楽しむことを目的としており、営利目的の使用は禁止される場合があります。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>2. 禁止事項</h2>
          <p>ユーザーは、以下の行為を行ってはなりません：</p>
          <ul style={ulStyle}>
            <li>他者の著作権・肖像権を侵害する行為</li>
            <li>誹謗中傷、差別的または暴力的なコンテンツの投稿</li>
            <li>スパム行為、広告目的の利用</li>
            <li>不正アクセス、サイト運営を妨害する行為</li>
            <li>その他、当サイトが不適切と判断する行為</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>3. 知的財産権</h2>
          <p>
            本サービス内で使用される画像・テキスト・コードなどの著作権は、当サイトまたは各権利者に帰属します。
            無断転載・転用・二次配布は禁止されています。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>4. 免責事項</h2>
          <p>
            当サイトは、掲載情報に関して正確性・完全性を保証するものではありません。
            また、本サービスの利用により生じた損害について、一切の責任を負いません。
            ユーザー間のトラブルについても関与いたしません。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>5. 利用規約の変更</h2>
          <p>
            本規約は、必要に応じてユーザーへの事前通知なく変更されることがあります。
            最新の利用規約は本ページに常時掲載され、変更後も本サービスの利用を継続した場合、同意したものとみなされます。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>6. 準拠法および管轄</h2>
          <p>
            本規約の解釈および適用に関しては日本法を準拠法とし、紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitleStyle}>7. お問い合わせ</h2>
          <p>
            本規約に関するお問い合わせは、以下のメールアドレスまでお願いいたします。<br />
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
