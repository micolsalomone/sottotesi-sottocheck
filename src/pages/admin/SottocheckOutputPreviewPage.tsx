export function SottocheckOutputPreviewPage() {
  const previewSrc = new URL('sottocheck-output-preview.html', window.location.origin + import.meta.env.BASE_URL).toString();

  return (
    <div
      style={{
        margin: '-1.5rem calc(-1.5rem - 40px)',
        height: 'calc(100vh - var(--header-height, 72px))',
        overflow: 'hidden',
      }}
    >
      <iframe
        title="Sottocheck Output Preview"
        src={previewSrc}
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
