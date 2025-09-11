export default function Head() {
  return (
    <>
      <link rel="preload" href="/api/pricing" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/_next/static/chunks/framework-*.js" as="script" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    </>
  );
}