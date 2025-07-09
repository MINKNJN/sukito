import { useEffect } from 'react';

export default function GoogleAd() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {}
  }, []);
  return (
    <ins className="adsbygoogle"
      style={{ display: 'block', textAlign: 'center', minHeight: 90 }}
      data-ad-client="ca-pub-2581272518746128"
      data-ad-slot="4782225618"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
} 