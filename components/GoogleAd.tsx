import { useEffect, useRef } from 'react';

interface GoogleAdProps {
  className?: string;
  style?: React.CSSProperties;
  adSlot?: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
}

export default function GoogleAd({ 
  className = '', 
  style = {}, 
  adSlot = '4782225618',
  adFormat = 'auto',
  fullWidthResponsive = true 
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && adRef.current) {
        // AdSense가 로드되었는지 확인
        if ((window as any).adsbygoogle) {
          (window as any).adsbygoogle.push({});
        } else {
          // AdSense가 로드되지 않은 경우 대기
          const checkAdSense = setInterval(() => {
            if ((window as any).adsbygoogle) {
              (window as any).adsbygoogle.push({});
              clearInterval(checkAdSense);
            }
          }, 100);
          
          // 10초 후 타임아웃
          setTimeout(() => clearInterval(checkAdSense), 10000);
        }
      }
    } catch (e) {
      console.warn('AdSense 로딩 오류:', e);
    }
  }, []);

  const defaultStyle: React.CSSProperties = {
    display: 'block',
    textAlign: 'center',
    minHeight: 90,
    ...style
  };

  return (
    <ins 
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={defaultStyle}
      data-ad-client="ca-pub-2581272518746128"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      data-adtest={process.env.NODE_ENV === 'development' ? 'on' : 'off'}
    />
  );
} 