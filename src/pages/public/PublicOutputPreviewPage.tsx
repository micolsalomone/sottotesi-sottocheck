export function PublicOutputPreviewPage() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--background)',
      }}
    >
      <iframe
        title="Sottocheck Output Preview"
        src="/sottocheck-output-preview.html"
        style={{
          width: '100%',
          height: '100vh',
          border: '0',
          display: 'block',
        }}
      />
    </div>
  );
}