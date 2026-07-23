export function PublicOutputPreviewPage() {
  const previewSrc = new URL('sottocheck-output-preview.html', window.location.origin + import.meta.env.BASE_URL).toString();

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
        src={previewSrc}
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