// pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="ja">
        <Head>
          <meta name="google-adsense-account" content="ca-pub-2581272518746128" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
