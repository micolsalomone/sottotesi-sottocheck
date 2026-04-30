export function SottocheckOutputPreviewPage() {
  const previewUrl = new URL('sottocheck-output-preview.html', window.location.origin + import.meta.env.BASE_URL);
  const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
    .map((link) => link.getAttribute('href') || '')
    .filter((href) => href.endsWith('.css'));

  cssLinks.forEach((href) => {
    const absoluteHref = new URL(href, window.location.origin).toString();
    previewUrl.searchParams.append('css', absoluteHref);
  });

  const previewSrc = previewUrl.toString();

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
