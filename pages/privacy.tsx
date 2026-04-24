// pages/privacy.tsx
import Header from '@/components/Header';
import Head from 'next/head';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>個人情報の取り扱いについて | スキト - 好きトーナメント</title>
        <meta name="description" content="スキトの個人情報の取り扱いについて説明します。" />
        <meta property="og:title" content="個人情報の取り扱いについて | スキト" />
        <meta property="og:url" content="https://sukito.net/privacy" />
        <link rel="canonical" href="https://sukito.net/privacy" />
      </Head>
      <Header />
      <div style={pageWrap}>
        <main style={card}>
          <h1 style={h1Style}>個人情報の取り扱いについて</h1>

          <section style={section}>
            <h2 style={sectionTitle}>1. 個人情報の処理目的</h2>
            <p>「スキト」は、以下の目的のためにのみ個人情報を処理します。</p>
            <ul style={ul}>
              <li>サービス利用に伴う本人確認および会員登録の意思確認</li>
              <li>会員資格の維持・管理</li>
              <li>サービスの不正利用防止</li>
              <li>各種通知・連絡および紛争対応のための記録保存</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>2. 個人情報の処理および保有期間</h2>
            <p>「スキト」は、利用者から同意を得た保有・利用期間、または法令に定める期間内において個人情報を処理・保有します。</p>
            <ul style={ul}>
              <li>会員登録・管理：退会時まで。ただし、法令違反に関する調査・捜査が進行中の場合は、その終了時まで。</li>
              <li>サービス提供：サービス提供の完了時まで。</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>3. 利用者の権利</h2>
            <p>利用者は個人情報の主体として、以下の権利をいつでも行使できます。</p>
            <ul style={ul}>
              <li>個人情報の閲覧請求</li>
              <li>誤りがある場合の訂正請求</li>
              <li>削除請求</li>
              <li>処理停止請求</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>4. 処理する個人情報の項目</h2>
            <p>「スキト」は以下の個人情報を処理しています。</p>
            <p style={subHead}>会員登録・管理</p>
            <ul style={ul}>
              <li>収集項目：メールアドレス、ニックネーム、パスワード（暗号化して保管）</li>
            </ul>
            <p style={{ ...subHead, marginTop: 14 }}>サービス利用時に自動で記録・収集される情報</p>
            <ul style={ul}>
              <li>接続IPアドレス、Cookie、アクセスログ、サービス利用履歴など</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>5. 個人情報の削除</h2>
            <p>「スキト」は、処理目的が達成された場合、遅滞なく個人情報を削除します。</p>
            <ul style={ul}>
              <li>電子ファイル形式で保存された個人情報は、復元不能な方法で削除します。</li>
              <li>保有期間が経過した場合は、期間終了日から5日以内に削除します。</li>
              <li>処理目的の達成、サービス廃止などにより不要となった場合も、同様に5日以内に削除します。</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>6. Cookieの使用について</h2>
            <p>「スキト」は、より良いサービスを提供するためにCookieを使用しています。</p>
            <ul style={ul}>
              <li><strong>使用目的：</strong>利用者の訪問状況・利用形態の把握、最適な情報提供のため。</li>
              <li><strong>拒否方法：</strong>ブラウザの設定（ツール &gt; インターネットオプション &gt; プライバシー）からCookieの保存を拒否できます。</li>
              <li><strong>注意：</strong>Cookieを無効にした場合、一部サービスの利用が制限されることがあります。</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>7. 個人情報の安全管理</h2>
            <p>「スキト」は個人情報の安全性確保のため、以下の措置を講じています。</p>
            <ul style={ul}>
              <li>パスワードは暗号化して保存・管理しており、本人のみが確認できます。</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>8. 個人情報保護の担当窓口</h2>
            <p>
              個人情報の処理に関するお問い合わせ、苦情、被害救済などは以下の窓口までご連絡ください。
              速やかに対応いたします。
            </p>
            <p style={{ marginTop: 10 }}>
              <strong>連絡先：</strong> rankingood5@gmail.com
            </p>
          </section>

          <section style={{ ...section, marginBottom: 0 }}>
            <h2 style={sectionTitle}>9. 取り扱い方針の変更</h2>
            <p>本方針は施行日より適用されます。内容に変更が生じた場合は、変更内容の施行7日前までにサイト上でお知らせします。</p>
          </section>

          <nav style={footerNav}>
            <a href="/about" style={navLink}>このサイトについて</a>
            <a href="/guide" style={navLink}>使い方ガイド</a>
            <a href="/terms" style={navLink}>利用規約</a>
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

const sectionTitle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: '#2e7d32',
  marginBottom: 10,
  paddingLeft: 10,
  borderLeft: '3px solid #4caf50',
};

const subHead: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.9rem',
  color: '#444',
  marginTop: 8,
  marginBottom: 4,
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
