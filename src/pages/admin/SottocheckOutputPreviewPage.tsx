import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function SottocheckOutputPreviewPage() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'sc-navigate' && event.data?.to) {
        navigate(event.data.to);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <div style={{
      margin: '-1.5rem calc(-1.5rem - 40px)',
      height: 'calc(100vh - var(--header-height, 72px))',
      overflow: 'hidden',
    }}>
      <iframe
        title="Sottocheck Output Preview"
        src="/sottocheck-output-preview.html"
        style={{
          width: '100%',
          height: '100%',
          border: '0',
          display: 'block',
        }}
      />
    </div>
  );
}
