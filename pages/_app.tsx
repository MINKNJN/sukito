// /pages/_app.tsx
import "@/styles/globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { AlertProvider } from "@/lib/alert";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AlertProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AlertProvider>
  );
}
