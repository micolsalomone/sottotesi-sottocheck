export function SottocheckOutputPreviewPage() {
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
